import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/axiosConfig';
import ModalAuth from './ModalAuth';
import MessagerieModal from './MessagerieModal';
import './Navbar.css';

/*
 * Barre de navigation principale, présente sur quasiment toutes les pages.
 *
 * Elle gère :
 *  - Les liens de navigation (accueil, formations, à propos, contact).
 *  - L'état de connexion : bouton "Se connecter" si déconnecté, sinon
 *    icône messagerie + avatar + bouton déconnexion.
 *  - Un badge de messages non lus actualisé toutes les 5 secondes (polling).
 *  - Un menu burger responsive pour mobile.
 *  - L'ouverture des modals d'authentification et de messagerie.
 */
export default function Navbar() {
    const { utilisateur, logout, estConnecte } = useAuth();
    const navigate = useNavigate();

    // États UI locaux : ouverture des modals + menu burger.
    const [modalOuverte, setModalOuverte] = useState(false);
    const [menuOuvert, setMenuOuvert] = useState(false);
    const [messagerieOuverte, setMessagerieOuverte] = useState(false);
    // Compteur de messages non lus pour le badge sur l'icône messagerie.
    const [nonLus, setNonLus] = useState(0);

    // Référence sur l'interval de polling pour pouvoir le clear au unmount.
    const intervalRef = useRef(null);

    // Le backend renvoie "nom", certains anciens composants utilisent "name" ; on supporte les deux.
    const nomUtilisateur = utilisateur?.nom || utilisateur?.name || '';

    /*
     * Effect : démarre le polling des messages non lus quand l'utilisateur est connecté.
     * Cleanup : stoppe l'interval au unmount ou quand l'utilisateur se déconnecte.
     */
    useEffect(() => {
        if (!utilisateur) {
            setNonLus(0);
            return;
        }

        const fetchNonLus = async () => {
            // Ne pas appeler l'API si le token est absent (localStorage vidé)
            if (!localStorage.getItem('token')) {
                setNonLus(0);
                return;
            }

            try {
                const response = await api.get('/messages/non-lus');
                setNonLus(response.data.non_lus ?? 0);
            } catch (error) {
                // 401 géré par l'intercepteur axiosConfig (nettoyage + redirection)
                // Stopper le polling si le token est invalide
                if (error.response?.status === 401) {
                    setNonLus(0);
                    clearInterval(intervalRef.current);
                }
                // Silence les autres erreurs (réseau, serveur temporairement indisponible)
            }
        };

        fetchNonLus();
        intervalRef.current = setInterval(fetchNonLus, 5000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [utilisateur]);

    /**
     * Déconnexion : purge la session, ferme le menu, redirige vers l'accueil.
     */
    const handleLogout = async () => {
        await logout();
        setMenuOuvert(false);
        setNonLus(0);
        navigate('/');
    };

    /**
     * Ferme le menu burger (utilisé après chaque clic sur un lien en mobile).
     */
    const fermerMenu = () => {
        setMenuOuvert(false);
    };

    /**
     * Redirige vers le bon dashboard selon le rôle de l'utilisateur.
     */
    const allerAuDashboard = () => {
        fermerMenu();

        navigate(
            utilisateur?.role === 'formateur'
                ? '/dashboard/formateur'
                : '/dashboard/apprenant'
        );
    };

    /**
     * Ouvre la modal de messagerie. On reset le badge à 0 dès l'ouverture
     * pour un retour visuel immédiat (le polling le remettra à jour si besoin).
     */
    const ouvrirMessagerie = () => {
        setMessagerieOuverte(true);
        setNonLus(0);
        fermerMenu();
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    <Link to="/" className="navbar-logo" onClick={fermerMenu}>
                        Skill<span className="navbar-logo-hub">Hub</span>
                    </Link>

                    <div className={`navbar-liens ${menuOuvert ? 'navbar-liens-ouvert' : ''}`}>
                        <Link to="/" className="navbar-lien" onClick={fermerMenu}>
                            Accueil
                        </Link>

                        <Link to="/formations" className="navbar-lien" onClick={fermerMenu}>
                            Formations
                        </Link>

                        <a href="#apropos" className="navbar-lien" onClick={fermerMenu}>
                            A propos
                        </a>

                        <a href="#contact" className="navbar-lien" onClick={fermerMenu}>
                            Contact
                        </a>

                        <div className="navbar-separateur" />

                        {estConnecte() ? (
                            <>
                                <button
                                    className="navbar-messagerie-btn"
                                    onClick={ouvrirMessagerie}
                                    title="Messagerie"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <polyline points="2,4 12,13 22,4" />
                                    </svg>

                                    {nonLus > 0 && (
                                        <span className="navbar-badge">
                                            {nonLus > 99 ? '99+' : nonLus}
                                        </span>
                                    )}
                                </button>

                                <button className="navbar-profil" onClick={allerAuDashboard}>
                                    {utilisateur?.photo_profil ? (
                                        <img
                                            src={`http://localhost:8001${utilisateur.photo_profil}`}
                                            alt="profil"
                                            className="navbar-avatar"
                                        />
                                    ) : (
                                        <span className="navbar-avatar-initiales">
                                            {nomUtilisateur.slice(0, 2).toUpperCase()}
                                        </span>
                                    )}

                                    {nomUtilisateur}
                                </button>

                                <button
                                    className="navbar-btn-deconnexion"
                                    onClick={handleLogout}
                                >
                                    Se deconnecter
                                </button>
                            </>
                        ) : (
                            <button
                                className="navbar-btn-connexion"
                                onClick={() => {
                                    setModalOuverte(true);
                                    fermerMenu();
                                }}
                            >
                                Se connecter
                            </button>
                        )}
                    </div>

                    <button
                        className={`navbar-burger ${menuOuvert ? 'navbar-burger-ouvert' : ''}`}
                        onClick={() => setMenuOuvert(!menuOuvert)}
                        aria-label="Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>

            {modalOuverte && (
                <ModalAuth
                    mode="login"
                    onFermer={() => setModalOuverte(false)}
                />
            )}

            {messagerieOuverte && (
                <MessagerieModal
                    onFermer={() => setMessagerieOuverte(false)}
                />
            )}
        </>
    );
}