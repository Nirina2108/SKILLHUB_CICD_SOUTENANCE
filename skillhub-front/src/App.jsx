import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AccueilPage from './pages/AccueilPage';
import CataloguePage from './pages/CataloguePage';
import DetailFormationPage from './pages/DetailFormationPage';
import DashboardFormateurPage from './pages/DashboardFormateurPage';
import DashboardApprenantPage from './pages/DashboardApprenantPage';
import ApprendrePage from './pages/ApprendrePage';
import ProfilPage from './pages/ProfilPage';

/*
 * Composant racine de l'application React SkillHub.
 *
 * Responsabilités :
 *  1. Définir la table de routage (BrowserRouter + Routes).
 *  2. Wrapper l'application dans l'AuthProvider pour rendre la session
 *     disponible dans tous les composants enfants.
 *  3. Protéger les routes selon l'état d'authentification et le rôle
 *     via les wrappers RoutePrivee / RouteFormateur / RouteApprenant.
 */

/**
 * Wrapper de route qui exige un utilisateur connecté.
 * Redirige vers la page d'accueil si la session est absente.
 */
function RoutePrivee({ children }) {
    const { estConnecte } = useAuth();
    return estConnecte() ? children : <Navigate to="/" />;
}

/**
 * Wrapper de route qui exige le rôle formateur.
 * À combiner avec RoutePrivee pour la protection complète.
 */
function RouteFormateur({ children }) {
    const { estFormateur } = useAuth();
    return estFormateur() ? children : <Navigate to="/" />;
}

/**
 * Wrapper de route qui exige le rôle apprenant.
 */
function RouteApprenant({ children }) {
    const { estApprenant } = useAuth();
    return estApprenant() ? children : <Navigate to="/" />;
}

/**
 * Définition de toutes les routes de l'application.
 *
 * Logique :
 *  - Routes publiques : accueil, catalogue, détail formation (visiteur autorisé).
 *  - Profil : tout utilisateur connecté, peu importe le rôle.
 *  - Dashboards : protégés par le rôle correspondant.
 *  - Apprendre : réservé à l'apprenant inscrit (le filtre d'inscription
 *    est fait côté ApprendrePage qui redirige si l'apprenant n'est pas inscrit).
 *  - Catch-all : toute URL inconnue renvoie sur l'accueil.
 */
function AppRoutes() {
    return (
        <Routes>
            <Route path="/"              element={<AccueilPage />} />
            <Route path="/formations"    element={<CataloguePage />} />
            <Route path="/formation/:id" element={<DetailFormationPage />} />

            <Route
                path="/profil"
                element={
                    <RoutePrivee>
                        <ProfilPage />
                    </RoutePrivee>
                }
            />

            <Route
                path="/dashboard/formateur"
                element={
                    <RoutePrivee>
                        <RouteFormateur>
                            <DashboardFormateurPage />
                        </RouteFormateur>
                    </RoutePrivee>
                }
            />

            <Route
                path="/dashboard/apprenant"
                element={
                    <RoutePrivee>
                        <RouteApprenant>
                            <DashboardApprenantPage />
                        </RouteApprenant>
                    </RoutePrivee>
                }
            />

            <Route
                path="/apprendre/:id"
                element={
                    <RoutePrivee>
                        <RouteApprenant>
                            <ApprendrePage />
                        </RouteApprenant>
                    </RoutePrivee>
                }
            />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

/**
 * Point d'entrée de l'arbre React.
 *
 * BrowserRouter doit envelopper TOUT ce qui utilise useNavigate / Link.
 * AuthProvider doit envelopper TOUT ce qui utilise useAuth() (donc à
 * l'intérieur du Router pour permettre les redirections via Navigate).
 */
export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
