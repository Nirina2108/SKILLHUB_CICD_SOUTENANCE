import { useState } from 'react';
// Service qui parle à l'API Laravel pour les CRUD formations.
import formationService from '../services/formationService';
import Bouton from './Bouton';
import './ModalFormation.css';

/**
 * Modal de création et modification d'une formation par le formateur.
 *
 * Le composant fonctionne en double mode (création vs modification) selon
 * la prop "formation" :
 *  - formation === null : mode création, formulaire vierge.
 *  - formation === objet : mode modification, formulaire pré-rempli avec les valeurs existantes.
 *
 * Champs gérés : titre, description, catégorie, niveau, et fichier PDF
 * (optionnel — si on est en modification et qu'un PDF existe, l'utilisateur
 * peut laisser le champ vide pour conserver le fichier actuel).
 *
 * @param {object} props
 * @param {object|null} props.formation Formation à modifier, ou null pour créer
 * @param {function} props.onFermer Ferme la modal sans rien sauvegarder
 * @param {function} props.onSauvegarder Callback après sauvegarde réussie (rafraîchit la liste parent)
 */
export default function ModalFormation({ formation, onFermer, onSauvegarder }) {
    // Distinction création vs modification pour adapter le label des boutons et les valeurs initiales.
    const estModification = formation !== null;

    // États contrôlés des champs du formulaire. Pré-remplis depuis "formation" si en modification.
    // L'opérateur ?. évite l'erreur si formation est null (mode création).
    // L'opérateur || fournit la valeur par défaut si la propriété est absente.
    const [titre,       setTitre]       = useState(formation?.titre       || '');
    const [description, setDescription] = useState(formation?.description || '');
    const [categorie,   setCategorie]   = useState(formation?.categorie   || 'developpement_web');
    const [niveau,      setNiveau]      = useState(formation?.niveau      || 'debutant');
    // fichierPdf : objet File du nouveau PDF à uploader, null si l'utilisateur n'a rien sélectionné.
    const [fichierPdf,  setFichierPdf]  = useState(null);
    const [erreur,      setErreur]      = useState('');
    const [chargement,  setChargement]  = useState(false);

    // Drapeau utilisé pour afficher un indicateur "PDF actuel — laisser vide pour conserver".
    // Boolean(undefined) = false, Boolean('chemin/fichier.pdf') = true.
    const aDejaUnPdf = Boolean(formation?.fichier_pdf);

    // Ferme la modal au clic sur l'overlay (pas sur le contenu interne).
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onFermer();
    };

    /**
     * Validation côté client du fichier PDF avant envoi :
     *  - Type MIME application/pdf.
     *  - Taille max 10 MB (pour éviter une requête inutile au serveur).
     */
    const handleFichierChange = (e) => {
        // e.target.files est une FileList ; on prend le 1er fichier (sélection unique).
        const file = e.target.files?.[0];
        // Pas de fichier sélectionné (annulation du dialogue) : on reset.
        if (!file) {
            setFichierPdf(null);
            return;
        }
        // Vérifie le type MIME annoncé par le navigateur.
        if (file.type !== 'application/pdf') {
            setErreur('Le fichier doit être un PDF.');
            e.target.value = '';   // vide l'input file pour laisser une nouvelle sélection
            return;
        }
        // 10 MB en octets = 10 * 1024 * 1024.
        if (file.size > 10 * 1024 * 1024) {
            setErreur('Le fichier dépasse 10 MB.');
            e.target.value = '';
            return;
        }
        // Tout est OK : on stocke le File pour l'envoi.
        setErreur('');
        setFichierPdf(file);
    };

    // Soumission du formulaire : crée ou modifie la formation selon le mode.
    const handleSubmit = async (e) => {
        e.preventDefault();        // empêche le reload de page
        setErreur('');
        setChargement(true);

        // Construction du payload. Le PDF est ajouté seulement s'il a été sélectionné.
        const data = { titre, description, categorie, niveau };
        if (fichierPdf) {
            data.fichier_pdf = fichierPdf;
        }

        try {
            // Appel approprié selon le mode (création ou modification).
            if (estModification) {
                await formationService.modifierFormation(formation.id, data);
            } else {
                await formationService.creerFormation(data);
            }
            // Notifie le parent (DashboardFormateur) qui va rafraîchir sa liste.
            onSauvegarder();
        } catch (error) {
            const msg = error.response?.data?.message || 'Erreur lors de la sauvegarde.';
            setErreur(msg);
        } finally {
            setChargement(false);
        }
    };

    return (
        <div className="mf-overlay" onClick={handleOverlayClick}>
            <div className="mf-boite">

                {/* Bouton de fermeture */}
                <button className="mf-fermer" onClick={onFermer}>✕</button>

                {/* Titre dynamique selon le mode */}
                <h2 className="mf-titre">
                    {estModification ? 'Modifier la formation' : 'Créer une formation'}
                </h2>

                {/* Affichage conditionnel du message d'erreur */}
                {erreur && <p className="mf-erreur">{erreur}</p>}

                <form onSubmit={handleSubmit} className="mf-formulaire">

                    {/* Champ titre */}
                    <label className="mf-label">Titre</label>
                    <input
                        type="text"
                        value={titre}                                    // input contrôlé
                        onChange={(e) => setTitre(e.target.value)}       // synchro state
                        className="mf-input"
                        placeholder="Titre de la formation"
                        required
                    />

                    {/* Champ description (textarea multi-lignes) */}
                    <label className="mf-label">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mf-textarea"
                        placeholder="Description complète de la formation"
                        rows={4}                                         // hauteur initiale
                        required
                    />

                    {/* Sélecteur de catégorie */}
                    <label className="mf-label">Catégorie</label>
                    <select
                        value={categorie}
                        onChange={(e) => setCategorie(e.target.value)}
                        className="mf-select"
                    >
                        {/* Les value doivent matcher les valeurs acceptées par la validation Laravel */}
                        <option value="developpement_web">Développement web</option>
                        <option value="data">Data</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="devops">DevOps</option>
                        <option value="autre">Autre</option>
                    </select>

                    {/* Sélecteur de niveau */}
                    <label className="mf-label">Niveau</label>
                    <select
                        value={niveau}
                        onChange={(e) => setNiveau(e.target.value)}
                        className="mf-select"
                    >
                        <option value="debutant">Débutant</option>
                        <option value="intermediaire">Intermédiaire</option>
                        <option value="avance">Avancé</option>
                    </select>

                    {/* Label du champ fichier PDF avec badge informatif si un PDF existe déjà */}
                    <label className="mf-label">
                        Fichier PDF du cours {aDejaUnPdf && <span className="mf-badge">PDF actuel — laisser vide pour conserver</span>}
                    </label>
                    {/* Input file restreint au PDF côté navigateur (boîte de dialogue filtrée) */}
                    <input
                        type="file"
                        accept="application/pdf"     // limite l'affichage aux fichiers PDF
                        onChange={handleFichierChange}
                        className="mf-input"
                    />
                    {/* Affichage du fichier sélectionné avec sa taille en MB */}
                    {fichierPdf && (
                        <p className="mf-fichier-info">
                            📄 {fichierPdf.name} ({(fichierPdf.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    )}

                    {/* Boutons d'action */}
                    <div className="mf-actions">
                        <Bouton
                            type="submit"
                            variante="principal"
                            taille="moyen"
                            disabled={chargement}
                        >
                            {/* Texte conditionnel selon mode + chargement */}
                            {chargement ? 'Sauvegarde...' : estModification ? 'Modifier' : 'Créer'}
                        </Bouton>
                        <Bouton
                            variante="secondaire"
                            taille="moyen"
                            onClick={onFermer}    // ferme sans sauvegarder
                        >
                            Annuler
                        </Bouton>
                    </div>

                </form>
            </div>
        </div>
    );
}
