// Hooks React utilisés :
//  - useState : état réactif (conversations, messages, contenu saisi, ...)
//  - useEffect : effets de bord (chargement initial, polling, auto-scroll)
//  - useRef : référence persistante pour l'id setInterval et l'élément à scroll-vers
import { useState, useEffect, useRef } from 'react';
import api from '../services/axiosConfig';
import './MessagerieModal.css';

/*
 * Modal de messagerie 1:1 entre apprenants et formateurs.
 *
 * Layout en deux panneaux :
 *  - Liste des conversations existantes (avec dernier message + nb non lus)
 *    + un onglet "Nouvelle conversation" qui liste les interlocuteurs disponibles.
 *  - Fil de la conversation active avec input de saisie.
 *
 * À chaque ouverture d'une conversation, les messages reçus non lus sont
 * automatiquement marqués comme lus côté backend (logique dans MessageController).
 *
 * @param {object} props
 * @param {function} props.onFermer Ferme la modal
 */
export default function MessagerieModal({ onFermer }) {

    // Liste des conversations chargée depuis le backend (objet par interlocuteur).
    const [conversations,  setConversations]  = useState([]);
    // Liste des interlocuteurs disponibles pour démarrer une nouvelle conversation.
    const [interlocuteurs, setInterlocuteurs] = useState([]);
    // Conversation actuellement ouverte (null si aucune).
    const [convActive,     setConvActive]     = useState(null);
    // Messages de la conversation active.
    const [messages,       setMessages]       = useState([]);
    // Contenu en cours de saisie dans le textarea.
    const [contenu,        setContenu]        = useState('');
    // Vrai quand l'utilisateur a cliqué "Nouveau message" (panneau de sélection d'interlocuteur).
    const [vueNouveau,     setVueNouveau]     = useState(false);
    // Drapeau d'envoi en cours (désactive le bouton).
    const [chargement,     setChargement]     = useState(false);
    // Drapeau de chargement initial des conversations (cache la liste tant que vrai).
    const [chargementInit, setChargementInit] = useState(true);
    const [erreur,         setErreur]         = useState('');

    // Référence sur l'id du setInterval de polling (pour pouvoir clearInterval au démontage).
    const pollingRef = useRef(null);
    // Référence sur le div sentinel en bas du fil de messages (pour auto-scroll).
    const messagesFinRef = useRef(null);

    // Effect 1 : charge la liste des conversations au montage de la modal.
    // .finally garantit qu'on désactive le drapeau de chargement même en cas d'erreur.
    useEffect(() => {
        chargerConversations().finally(() => setChargementInit(false));
    }, []);

    // Effect 2 : polling automatique des messages de la conversation active toutes les 3s.
    // Permet de voir les nouveaux messages en quasi temps réel.
    useEffect(() => {
        if (!convActive) return;     // pas de conversation ouverte -> pas de polling
        // setInterval rappelle chargerMessages avec silencieux=true pour ne pas afficher d'erreur.
        pollingRef.current = setInterval(() => chargerMessages(convActive.interlocuteur_id, true), 3000);
        // Cleanup : stoppe le polling quand convActive change ou au démontage.
        return () => clearInterval(pollingRef.current);
    }, [convActive]);

    // Effect 3 : auto-scroll vers le bas quand de nouveaux messages arrivent.
    // scrollIntoView fait défiler le parent pour rendre l'élément visible.
    useEffect(() => {
        messagesFinRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Effect 4 : auto-clear du message d'erreur après 4 secondes.
    useEffect(() => {
        if (!erreur) return;          // pas d'erreur -> rien à clear
        const t = setTimeout(() => setErreur(''), 4000);
        return () => clearTimeout(t); // si l'erreur change avant les 4s, on annule l'ancien timeout
    }, [erreur]);

    // GET /messages/conversations -> liste agrégée des conversations (1 par interlocuteur).
    const chargerConversations = async () => {
        try {
            const response = await api.get('/messages/conversations');
            // ?? [] : si conversations est null/undefined, on met un tableau vide.
            setConversations(response.data.conversations ?? []);
        } catch (e) { /* silence polling : on n'affiche pas d'erreur ici */ }
    };

    // GET /messages/conversation/{interlocuteurId} -> messages d'une conversation.
    // Le paramètre silencieux évite d'afficher une erreur quand le polling rate (réseau temporaire).
    const chargerMessages = async (interlocuteurId, silencieux = false) => {
        try {
            const response = await api.get(`/messages/conversation/${interlocuteurId}`);
            setMessages(response.data.messages ?? []);
        } catch (e) {
            if (!silencieux) setErreur('Impossible de charger les messages.');
        }
    };

    // Ouvre une conversation existante : stoppe l'ancien polling, charge les messages, re-fetch les convs.
    const ouvrirConversation = async (conv) => {
        clearInterval(pollingRef.current);     // stop l'ancien polling
        setConvActive(conv);                    // déclenche l'effet 2 qui démarre un nouveau polling
        setVueNouveau(false);                   // ferme le panneau "nouveau message" si ouvert
        setErreur('');
        await chargerMessages(conv.interlocuteur_id);
        chargerConversations();                 // re-fetch les conversations pour MAJ les "non_lus"
    };

    // Ouvre le panneau "Nouveau message" et charge la liste des interlocuteurs disponibles.
    const ouvrirNouveauMessage = async () => {
        setVueNouveau(true);
        setConvActive(null);    // pas de conversation active tant qu'on n'a pas choisi un interlocuteur
        setMessages([]);
        setErreur('');
        try {
            // GET /messages/interlocuteurs -> formateur voit les apprenants et vice-versa.
            const response = await api.get('/messages/interlocuteurs');
            setInterlocuteurs(response.data.interlocuteurs ?? []);
        } catch (e) {
            setErreur('Impossible de charger les contacts.');
        }
    };

    // Envoie un message dans la conversation active.
    const envoyerMessage = async (destinataireId) => {
        // Empêche l'envoi si vide (ou que des espaces) ou déjà en cours d'envoi.
        if (!contenu.trim() || chargement) return;
        setChargement(true);
        setErreur('');
        try {
            await api.post('/messages/envoyer', {
                destinataire_id: destinataireId,
                contenu:         contenu.trim(),     // .trim() enlève espaces avant/après
            });
            setContenu('');                          // vide le textarea
            await chargerMessages(destinataireId);   // re-fetch pour voir le nouveau message
            chargerConversations();                  // MAJ la liste des conversations
        } catch (e) {
            setErreur(e.response?.data?.message || "Erreur lors de l'envoi.");
        } finally {
            setChargement(false);
        }
    };

    // Permet d'envoyer avec Entrée (Shift+Entrée fait un retour à la ligne, comme Slack/Discord).
    const gererToucheEntree = (e, destinataireId) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();   // empêche le saut de ligne par défaut du textarea
            envoyerMessage(destinataireId);
        }
    };

    // Helper extrayant la branche conditionnelle de la liste des conversations.
    // Évite le ternaire imbriqué que SonarLint flagge (javascript:S3358).
    const renderConversationsListe = () => {
        if (chargementInit) {
            return <p className="msg-vide">Chargement...</p>;
        }
        if (conversations.length === 0) {
            return <p className="msg-vide">Aucune conversation — cliquez ✏️ pour commencer</p>;
        }
        // Pour chaque conversation, on rend une card cliquable.
        return conversations.map((conv) => (
            <div
                key={conv.interlocuteur_id}
                // Classe conditionnelle : "msg-conv-actif" si c'est la conversation ouverte.
                className={`msg-conv-item ${convActive?.interlocuteur_id === conv.interlocuteur_id ? 'msg-conv-actif' : ''}`}
                onClick={() => ouvrirConversation(conv)}
            >
                {/* Avatar = 2 premières lettres du nom en majuscule */}
                <div className="msg-avatar">{conv.interlocuteur_nom?.slice(0, 2).toUpperCase()}</div>
                <div className="msg-conv-info">
                    <span className="msg-conv-nom">{conv.interlocuteur_nom}</span>
                    <span className="msg-conv-apercu">{conv.dernier_message}</span>
                </div>
                {/* Badge non lus affiché seulement si > 0 */}
                {conv.non_lus > 0 && <span className="msg-badge">{conv.non_lus}</span>}
            </div>
        ));
    };

    return (
        // Overlay : fond semi-transparent. Clic dessus = fermeture (mais pas sur le contenu).
        <div className="msg-overlay" onClick={(e) => e.target === e.currentTarget && onFermer()}>
            <div className="msg-modal">

                {/* Sidebar gauche : liste des conversations + bouton nouveau message */}
                <div className="msg-sidebar">
                    <div className="msg-sidebar-header">
                        <h3>Messages</h3>
                        {/* Bouton crayon pour démarrer une nouvelle conversation */}
                        <button className="msg-btn-nouveau" onClick={ouvrirNouveauMessage} title="Nouveau message">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {/* Path 1 : enveloppe ouverte | Path 2 : crayon */}
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>

                    {/* Liste des conversations rendue par le helper */}
                    <div className="msg-conv-liste">
                        {renderConversationsListe()}
                    </div>
                </div>

                {/* Panneau droit : conversation active OU panneau nouveau message OU placeholder */}
                <div className="msg-chat">
                    <button className="msg-fermer" onClick={onFermer}>✕</button>

                    {/* Bandeau d'erreur affiché 4s puis auto-clear */}
                    {erreur && <div className="msg-erreur-bandeau">{erreur}</div>}

                    {/* Vue 1 : sélection d'un nouvel interlocuteur */}
                    {vueNouveau && (
                        <div className="msg-nouveau">
                            <h4>Nouveau message</h4>
                            <p className="msg-nouveau-desc">Choisissez un destinataire :</p>
                            {/* Ternaire simple : si vide, message ; sinon, liste */}
                            {interlocuteurs.length === 0 ? (
                                <p className="msg-vide">Aucun utilisateur disponible.</p>
                            ) : (
                                interlocuteurs.map((u) => (
                                    <div
                                        key={u.id}
                                        className="msg-interlocuteur"
                                        // Au clic, on ouvre une "fausse" conversation avec cet interlocuteur.
                                        onClick={() => ouvrirConversation({
                                            interlocuteur_id:  u.id,
                                            interlocuteur_nom: u.nom,
                                            non_lus:           0,
                                        })}
                                    >
                                        <div className="msg-avatar">{u.nom?.slice(0, 2).toUpperCase()}</div>
                                        <div>
                                            <span className="msg-conv-nom">{u.nom}</span>
                                            {/* Affiche le rôle pour différencier formateur/apprenant */}
                                            <span className="msg-role"> — {u.role}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Vue 2 : conversation active (header + messages + saisie) */}
                    {convActive && !vueNouveau && (
                        <>
                            {/* Header avec avatar + nom de l'interlocuteur */}
                            <div className="msg-chat-header">
                                <div className="msg-avatar">{convActive.interlocuteur_nom?.slice(0, 2).toUpperCase()}</div>
                                <span>{convActive.interlocuteur_nom}</span>
                            </div>

                            {/* Liste des messages avec auto-scroll vers le bas */}
                            <div className="msg-messages">
                                {/* Message vide si aucun échange encore */}
                                {messages.length === 0 && (
                                    <p className="msg-vide" style={{ textAlign: 'center', marginTop: '2rem' }}>
                                        Commencez la conversation !
                                    </p>
                                )}
                                {/* Bulle pour chaque message — alignement à droite si c'est moi */}
                                {messages.map((m) => {
                                    // expediteur_id !== interlocuteur_id => c'est moi qui ai envoyé.
                                    const moi = m.expediteur_id !== convActive.interlocuteur_id;
                                    return (
                                        <div key={m.id} className={`msg-bulle-wrap ${moi ? 'msg-moi' : 'msg-autre'}`}>
                                            <div className="msg-bulle">{m.contenu}</div>
                                            {/* Heure au format HH:MM (locale française) */}
                                            <span className="msg-heure">
                                                {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                                {/* Sentinel invisible : cible du scrollIntoView pour défilement auto. */}
                                <div ref={messagesFinRef} />
                            </div>

                            {/* Zone de saisie en bas */}
                            <div className="msg-saisie">
                                <textarea
                                    value={contenu}
                                    onChange={(e) => setContenu(e.target.value)}
                                    // Entrée envoie, Shift+Entrée saute une ligne.
                                    onKeyDown={(e) => gererToucheEntree(e, convActive.interlocuteur_id)}
                                    placeholder="Écrivez un message... (Entrée pour envoyer)"
                                    rows={2}
                                    disabled={chargement}
                                />
                                <button
                                    onClick={() => envoyerMessage(convActive.interlocuteur_id)}
                                    // Disabled si chargement ou contenu vide après trim.
                                    disabled={chargement || !contenu.trim()}
                                    className="msg-btn-envoyer"
                                >
                                    {chargement ? '...' : (
                                        // Icône avion en papier (envoi)
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"/>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Vue 3 : placeholder (pas de conversation active ni de mode nouveau) */}
                    {!convActive && !vueNouveau && (
                        <div className="msg-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                {/* Bulle de discussion */}
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            <p>Sélectionnez une conversation<br/>ou cliquez ✏️ pour en démarrer une</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
