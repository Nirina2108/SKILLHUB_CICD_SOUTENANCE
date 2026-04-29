// Hooks React utilisés ici :
//  - useState : état local du composant (modal ouverte, badge non lus, ...)
//  - useEffect : effet de bord après render (polling périodique)
//  - useRef : référence persistante entre les renders (id de l'interval setInterval)
import { useState, useEffect, useRef } from 'react';
// Link : navigation React Router (sans rechargement) | useNavigate : redirection programmatique
import { Link, useNavigate } from 'react-router-dom';
// Hook personnalisé pour accéder au contexte d'authentification (user, login, logout, ...).
import { useAuth } from '../context/AuthContext';
// Client axios mutualisé pour appeler l'API Laravel.
import api from '../services/axiosConfig';
// Modals enfants gérées par la navbar.
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
    // Récupère l'utilisateur courant et les helpers d'auth depuis le contexte global.
    const { utilisateur, logout, estConnecte } = useAuth();
    // useNavigate retourne une fonction qui change la route programmatiquement.
    const navigate = useNavigate();

    // États UI locaux : ouverture des modals + menu burger.
    const [modalOuverte, setModalOuverte] = useState(false);            // modal login/register
    const [menuOuvert, setMenuOuvert] = useState(false);                // menu burger mobile
    const [messagerieOuverte, setMessagerieOuverte] = useState(false);  // modal messagerie
    // Compteur de messages non lus pour le badge sur l'icône messagerie.
    const [nonLus, setNonLus] = useState(0);

    // useRef : conteneur mutable qui SURVIT aux re-renders (contrairement à une variable normale).
    // On y stocke l'id retourné par setInterval pour pouvoir l'annuler dans le cleanup.
    const intervalRef = useRef(null);

    // Le backend renvoie "nom", certains anciens composants utilisent "name" ; on supporte les deux.
    // L'opérateur ?. évite l'erreur si utilisateur est null/undefined.
    const nomUtilisateur = utilisateur?.nom || utilisateur?.name || '';

    /*
     * Effect : démarre le polling des messages non lus quand l'utilisateur est connecté.
     * Cleanup : stoppe l'interval au unmount ou quand l'utilisateur se déconnecte.
     * Le tableau [utilisateur] dit à React : ne ré-exécute cet effet que si utilisateur change.
     */
    useEffect(() => {
        // Si déconnecté, on remet le badge à 0 et on ne lance pas de polling.
        if (!utilisateur) {
            setNonLus(0);
            return;
        }

        // Fonction asynchrone qui interroge le backend pour le nombre de messages non lus.
        const fetchNonLus = async () => {
            // Sécurité : ne pas appeler l'API si le token est absent (localStorage vidé).
            if (!localStorage.getItem('token')) {
                setNonLus(0);
                return;
            }

            try {
                // GET /messages/non-lus -> { non_lus: 5 }
                const response = await api.get('/messages/non-lus');
                // ?? 0 : si la propriété est null/undefined, on utilise 0 par défaut.
                setNonLus(response.data.non_lus ?? 0);
            } catch (error) {
                // 401 géré par l'intercepteur axiosConfig (nettoyage + redirection).
                // On stoppe le polling pour ne pas spammer le backend avec des requêtes invalides.
                if (error.response?.status === 401) {
                    setNonLus(0);
                    clearInterval(intervalRef.current);
                }
                // Autres erreurs (réseau, 500, ...) : on les ignore silencieusement.
            }
        };

        // 1er appel immédiat puis toutes les 5 secondes.
        fetchNonLus();
        intervalRef.current = setInterval(fetchNonLus, 5000);

        // Fonction de cleanup retournée par useEffect : appelée avant le prochain effet et au unmount.
        // Indispensable pour ne pas laisser des intervals zombies.
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [utilisateur]);  // tableau de dépendances : l'effet relance si utilisateur change

    /**
     * Déconnexion : purge la session, ferme le menu, redirige vers l'accueil.
     */
    const handleLogout = async () => {
        await logout();           // appel API + purge localStorage (via authService)
        setMenuOuvert(false);     // referme le menu mobile s'il était ouvert
        setNonLus(0);             // reset le badge
        navigate('/');            // redirection vers l'accueil
    };

    /**
     * Ferme le menu burger (utilisé après chaque clic sur un lien en mobile).
     */
    const fermerMenu = () => {
        setMenuOuvert(false);
    };

    /**
     * Redirige vers le bon dashboard selon le rôle de l'utilisateur.
     * Ternaire : si formateur -> dashboard formateur, sinon -> dashboard apprenant.
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

    // JSX retourné. Le fragment <> </> évite d'introduire un wrapper inutile dans le DOM.
    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    {/* Logo SkillHub : clic = retour à l'accueil */}
                    <Link to="/" className="navbar-logo" onClick={fermerMenu}>
                        Skill<span className="navbar-logo-hub">Hub</span>
                    </Link>

                    {/* Conteneur des liens. La classe conditionnelle "navbar-liens-ouvert"
                        affiche le menu en mode mobile quand menuOuvert=true. */}
                    <div className={`navbar-liens ${menuOuvert ? 'navbar-liens-ouvert' : ''}`}>
                        {/* Liens de navigation principale */}
                        <Link to="/" className="navbar-lien" onClick={fermerMenu}>
                            Accueil
                        </Link>

                        <Link to="/formations" className="navbar-lien" onClick={fermerMenu}>
                            Formations
                        </Link>

                        {/* href="#apropos" : ancres internes vers des sections de la page */}
                        <a href="#apropos" className="navbar-lien" onClick={fermerMenu}>
                            A propos
                        </a>

                        <a href="#contact" className="navbar-lien" onClick={fermerMenu}>
                            Contact
                        </a>

                        {/* Séparateur visuel entre liens et zone utilisateur */}
                        <div className="navbar-separateur" />

                        {/* Branche conditionnelle : connecté vs déconnecté */}
                        {estConnecte() ? (
                            // Si connecté : icône messagerie + avatar + bouton déconnexion
                            <>
                                {/* Bouton messagerie avec icône SVG inline (enveloppe) */}
                                <button
                                    className="navbar-messagerie-btn"
                                    onClick={ouvrirMessagerie}
                                    title="Messagerie"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"  // hérite de la couleur du texte parent
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        {/* Rectangle = enveloppe */}
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        {/* Polyligne = pli supérieur de l'enveloppe */}
                                        <polyline points="2,4 12,13 22,4" />
                                    </svg>

                                    {/* Badge rouge avec compteur non lus, affiché seulement si > 0 */}
                                    {nonLus > 0 && (
                                        <span className="navbar-badge">
                                            {/* Cap à "99+" pour éviter l'affichage de 12345 */}
                                            {nonLus > 99 ? '99+' : nonLus}
                                        </span>
                                    )}
                                </button>

                                {/* Bouton profil : avatar + nom utilisateur, clic = aller au dashboard */}
                                <button className="navbar-profil" onClick={allerAuDashboard}>
                                    {/* Si l'utilisateur a uploadé une photo : afficher l'image */}
                                    {utilisateur?.photo_profil ? (
                                        <img
                                            src={`http://localhost:8001${utilisateur.photo_profil}`}
                                            alt="profil"
                                            className="navbar-avatar"
                                        />
                                    ) : (
                                        // Sinon : initiales (2 premières lettres du nom en majuscule)
                                        <span className="navbar-avatar-initiales">
                                            {nomUtilisateur.slice(0, 2).toUpperCase()}
                                        </span>
                                    )}

                                    {nomUtilisateur}
                                </button>

                                {/* Bouton déconnexion */}
                                <button
                                    className="navbar-btn-deconnexion"
                                    onClick={handleLogout}
                                >
                                    Se deconnecter
                                </button>
                            </>
                        ) : (
                            // Si déconnecté : un seul bouton qui ouvre la modal d'authentification
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

                    {/* Bouton hamburger visible uniquement en mobile (CSS).
                        Les 3 spans sont les 3 traits horizontaux. */}
                    <button
                        className={`navbar-burger ${menuOuvert ? 'navbar-burger-ouvert' : ''}`}
                        onClick={() => setMenuOuvert(!menuOuvert)}  // toggle ouverture
                        aria-label="Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>

            {/* Modal d'authentification rendue conditionnellement */}
            {modalOuverte && (
                <ModalAuth
                    mode="login"
                    onFermer={() => setModalOuverte(false)}
                />
            )}

            {/* Modal messagerie rendue conditionnellement */}
            {messagerieOuverte && (
                <MessagerieModal
                    onFermer={() => setMessagerieOuverte(false)}
                />
            )}
        </>
    );
}
