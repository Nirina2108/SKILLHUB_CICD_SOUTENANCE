import api from './axiosConfig';

function construireFormData(data) {
    const formData = new FormData();
    Object.entries(data).forEach(([cle, valeur]) => {
        if (valeur === null || valeur === undefined) return;
        formData.append(cle, valeur);
    });
    return formData;
}

const formationService = {

    /**
     * Récupérer toutes les formations avec filtres optionnels.
     * GET /formations
     */
    getFormations: async (filtres = {}) => {
        const response = await api.get('/formations', { params: filtres });
        return response.data;
    },

    /**
     * Récupérer le détail d'une formation.
     * GET /formations/:id
     */
    getFormation: async (id) => {
        const response = await api.get(`/formations/${id}`);
        return response.data;
    },

    /**
     * Créer une nouvelle formation (formateur uniquement).
     * POST /formations — multipart pour upload PDF optionnel.
     * Content-Type undefined laisse le browser fixer multipart/form-data avec boundary.
     */
    creerFormation: async (data) => {
        const formData = construireFormData(data);
        const response = await api.post('/formations', formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    /**
     * Modifier une formation existante (formateur propriétaire uniquement).
     * Méthode spoofing : POST + _method=PUT pour permettre multipart.
     */
    modifierFormation: async (id, data) => {
        const formData = construireFormData(data);
        formData.append('_method', 'PUT');
        const response = await api.post(`/formations/${id}`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },

    /**
     * Télécharge le PDF du cours (formateur propriétaire OU apprenant inscrit).
     * GET /formations/:id/pdf — déclenche un download navigateur.
     */
    telechargerPdf: async (id, titre = 'cours') => {
        const response = await api.get(`/formations/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = `${titre.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
        document.body.appendChild(lien);
        lien.click();
        lien.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Ouvre le PDF du cours dans un nouvel onglet (pour lecture).
     * Le blob URL doit être révoqué un peu plus tard (le navigateur a besoin du temps d'ouvrir).
     */
    ouvrirPdf: async (id) => {
        const response = await api.get(`/formations/${id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    },

    /**
     * Supprimer une formation (formateur propriétaire uniquement).
     * DELETE /formations/:id
     */
    supprimerFormation: async (id) => {
        const response = await api.delete(`/formations/${id}`);
        return response.data;
    },

    /**
     * Récupérer uniquement les formations du formateur connecté.
     * GET /formateur/mes-formations
     */
    getMesFormations: async () => {
        const response = await api.get('/formateur/mes-formations');
        return response.data;
    },
};

export default formationService;