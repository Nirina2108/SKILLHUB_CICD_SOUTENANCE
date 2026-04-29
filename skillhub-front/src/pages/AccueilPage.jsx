// Hooks React + navigation + contexte auth + services + composants partagés.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import formationService from '../services/formationService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ModalAuth from '../components/ModalAuth';
import './AccueilPage.css';

/*
 * Page d'accueil publique de SkillHub.
 *
 * Présente l'application aux visiteurs anonymes et connectés :
 *  - Hero section avec accroche et call-to-action (inscription / catalogue).
 *  - Sélection de formations vedettes pour donner envie de s'inscrire.
 *  - Sections marketing (avantages, témoignages, etc.).
 *
 * Route : / (publique, accessible à tous)
 */
export default function AccueilPage() {
    // estConnecte() : helper du contexte qui retourne true si user connecté.
    const { estConnecte } = useAuth();
    const navigate = useNavigate();

    // État local : 3 formations vedettes + drapeau de chargement + mode modal auth.
    const [formations,  setFormations]  = useState([]);
    const [chargement,  setChargement]  = useState(true);
    // modalMode : null (modal fermée) | 'login' | 'register'.
    const [modalMode,   setModalMode]   = useState(null);

    // Effect : charge 3 formations vedettes au montage de la page.
    useEffect(() => {
        const charger = async () => {
            try {
                const data = await formationService.getFormations();
                // .slice(0, 3) : on prend les 3 premières pour l'aperçu (pas tout le catalogue).
                setFormations(data.slice(0, 3));
            } catch (error) {
                // En cas d'erreur, on logue mais on n'affiche rien à l'utilisateur
                // (page d'accueil reste accessible).
                console.error('Erreur chargement formations :', error);
            } finally {
                setChargement(false);
            }
        };
        charger();
    }, []);  // [] = exécuté une seule fois au montage

    // Données statiques des témoignages — codées en dur car contenu marketing fixe.
    const temoignages = [
        {
            nom:    'Ikalo RAZAFIMAHARAVO',
            role:   'Apprenante Front-End',
            texte:  "Des cours clairs, un suivi réel et une plateforme très intuitive. J'ai trouvé mon premier job grâce à cette formation.",
            avatar: 'IR',          // initiales pour l'avatar par défaut
        },
        {
            nom:    'Ny Aiko RASOLOARIDIMBY',
            role:   'Formateur Back-End',
            texte:  'Une vraie vision pédagogique, des outils modernes et une communauté engagée.',
            avatar: 'NR',
        },
        {
            nom:    'Andry RAKOTOARISOA',
            role:   'Apprenant Full Stack',
            texte:  "La meilleure plateforme pour apprendre vite et bien. L'accompagnement est exceptionnel.",
            avatar: 'AR',
        },
    ];

   // Tableau des logos partenaires avec les vrais chemins d'images
const partenaires = [
  { id: 1,  src: '/images/carroussel/univ1.jpg',  alt: 'Partenaire 1'  },
  { id: 2,  src: '/images/carroussel/univ2.png',  alt: 'Partenaire 2'  },
  { id: 3,  src: '/images/carroussel/univ3.jpg',  alt: 'Partenaire 3'  },
  { id: 4,  src: '/images/carroussel/univ4.jpg',  alt: 'Partenaire 4'  },
  { id: 5,  src: '/images/carroussel/univ5.jpg',  alt: 'Partenaire 5'  },
  { id: 6,  src: '/images/carroussel/univ6.png',  alt: 'Partenaire 6'  },
  { id: 7,  src: '/images/carroussel/univ7.jpg',  alt: 'Partenaire 7'  },
  { id: 8,  src: '/images/carroussel/univ8.jpg',  alt: 'Partenaire 8'  },
  { id: 9,  src: '/images/carroussel/univ9.png',  alt: 'Partenaire 9'  },
  { id: 10, src: '/images/carroussel/univ10.jpg', alt: 'Partenaire 10' },
];
    // Convertit les valeurs internes des niveaux en libellés affichables.
    // Si la valeur n'est pas connue, on retourne tel quel (fallback).
    const getNiveauLabel = (niveau) => {
        const labels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
        return labels[niveau] || niveau;
    };

    // Helper extrayant la branche conditionnelle (chargement / vide / liste).
    // Évite le ternaire imbriqué que SonarLint flagge (javascript:S3358).
    const renderFormationsAUne = () => {
        if (chargement) {
            return <p className="accueil-chargement">Chargement...</p>;
        }
        if (formations.length === 0) {
            return <p className="accueil-vide">Aucune formation disponible pour le moment.</p>;
        }
        return (
            <div className="accueil-formations-grille">
                {formations.map((formation) => (
                    <div key={formation.id} className="accueil-formation-card">
                        <span className="accueil-badge-niveau">
                            {getNiveauLabel(formation.niveau)}
                        </span>
                        <h3>{formation.titre}</h3>
                        <p className="accueil-formation-formateur">
                            Par {formation.formateur?.nom}
                        </p>
                        <button
                            className="btn-principal"
                            onClick={() => navigate(`/formation/${formation.id}`)}
                        >
                            Voir le detail
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="accueil-page">
            <Navbar />

            {/* HERO : section d'accroche en haut de page avec titre + image */}
            <section className="accueil-hero">
                <div className="accueil-hero-texte">
                    <h1 className="accueil-hero-titre">
                        Get <span className="mot-bleu">trained today</span>,<br />
                        <span className="mot-violet">lead tomorrow</span>
                    </h1>
                    <p className="accueil-hero-desc">
                        SKILLHUB vous aide à lancer votre carrière. Formations pratiques,
                        projets réels et accompagnement pour progresser vite.
                    </p>
                    {/* Boutons d'action affichés UNIQUEMENT si l'utilisateur n'est pas connecté.
                        Un utilisateur connecté n'a pas besoin de "S'inscrire". */}
                    {!estConnecte() && (
                        <div className="accueil-hero-actions">
                            <button
                                className="btn-principal"
                                // Ouvre la modal directement sur l'onglet register.
                                onClick={() => setModalMode('register')}
                            >
                                S'inscrire
                            </button>
                            <button
                                className="btn-secondaire"
                                // Renvoie vers le catalogue public.
                                onClick={() => navigate('/formations')}
                            >
                                Formations
                            </button>
                        </div>
                    )}
                </div>
                <div className="accueil-hero-image">
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                        alt="Apprenants SkillHub"
                        loading="lazy"
                    />
                </div>
            </section>

            {/* COMMENT CA MARCHE : 4 cards "glass" avec image de fond + overlay sombre */}
<section className="accueil-fonctionnement">
    <h2 className="titre-section">Comment ca marche ?</h2>
    <div className="accueil-cards-grille">
        {/* Tableau anonyme + .map => 4 cards générées dynamiquement.
            Pas besoin d'extraire le tableau en variable car utilisé une seule fois. */}
        {[
            { titre: 'Build up yourself', desc: 'Developpe tes competences avec des cours guides et projets.', chip: 'Explorer',   photo: '/images/ccm/build.jpg' },
            { titre: 'Enroll',            desc: "Inscris-toi rapidement et commence des aujourd'hui.",          chip: "S'inscrire", photo: '/images/ccm/enroll.jpg' },
            { titre: 'Resources',         desc: 'Accede aux supports, quiz, PDF et suivi des progres.',          chip: 'Voir plus',  photo: '/images/ccm/ressource.jpg' },
            { titre: 'Call',              desc: "Contacte-nous pour plus d'information.",                       chip: 'Contacter',  photo: '/images/ccm/call.jpg' },
        ].map((item, i) => (
            <div
                key={i}
                className="accueil-card-glass"
                style={{ backgroundImage: `url(${item.photo})` }}
            >
                {/* Overlay sombre pour lisibilité */}
                <div className="accueil-card-overlay" />
                <div className="accueil-card-contenu">
                    <h3>{item.titre}</h3>
                    <p>{item.desc}</p>
                    <span className="accueil-card-chip">{item.chip}</span>
                </div>
            </div>
        ))}
    </div>
</section>

            {/* NOS VALEURS : 3 cards avec image en arrière-plan via CSS variable --bg */}
            <section className="accueil-valeurs">
                <h2 className="titre-section">Nos valeurs</h2>
                <p className="sous-titre-section">Ce qui rend SkillHub unique au quotidien.</p>
                <div className="accueil-valeurs-grille">
                    {[
                        {
                            titre: 'Accessibilité',
                            desc:  'Des contenus clairs, progressifs et disponibles 24h/24.',
                            btn:   'Découvrir',
                            img:   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
                        },
                        {
                            titre: 'Excellence',
                            desc:  'Des programmes conçus par des formateurs expérimentés.',
                            btn:   'Voir les programmes',
                            img:   'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
                        },
                        {
                            titre: 'Accompagnement',
                            desc:  "Une communauté d'apprenants et de formateurs à votre écoute.",
                            btn:   'Rejoindre',
                            img:   'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
                        },
                    ].map((val, i) => (
                        <div key={i} className="accueil-valeur-card" style={{ '--bg': `url(${val.img})` }}>
                            <div className="accueil-valeur-overlay" />
                            <div className="accueil-valeur-contenu">
                                <h3>{val.titre}</h3>
                                <p>{val.desc}</p>
                                <button className="btn-valeur">{val.btn}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FORMATIONS A LA UNE : 3 formations vedettes chargées depuis le backend */}
            <section className="accueil-formations">
                <h2 className="titre-section">Formations a la une</h2>
                {/* Helper qui rend chargement / vide / liste selon l'état */}
                {renderFormationsAUne()}
                <div className="accueil-voir-tout">
                    <button
                        className="btn-secondaire"
                        onClick={() => navigate('/formations')}
                    >
                        Voir toutes les formations
                    </button>
                </div>
            </section>

            {/* PARTENAIRES : carousel de logos universités/entreprises avec animation infinie */}
<section className="accueil-partenaires">

  <h2 className="titre-section">Nos Partenaires officiels</h2>
  <p className="accueil-partenaires-desc">
    Ils nous soutiennent dans notre mission éducative depuis plusieurs années.
  </p>

  <div className="carousel-wrapper">
    <div className="carousel-track">
      {/* [...arr, ...arr] : on duplique le tableau pour qu'au moment où la fin défile,
          le début apparaisse à droite — illusion de carrousel infini sans saut. */}
      {[...partenaires, ...partenaires].map((p, i) => (
        <div key={i} className="carousel-card">
          <img
            src={p.src}
            alt={p.alt}
            className="carousel-logo"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  </div>

</section>
            {/* TEMOIGNAGES : 3 cards avec avis utilisateurs */}
            <section className="accueil-temoignages">
                <h2 className="titre-section">Ils nous font confiance</h2>
                <div className="accueil-temoignages-grille">
                    {/* Boucle sur le tableau temoignages déclaré en haut du composant */}
                    {temoignages.map((t, i) => (
                        <div key={i} className="accueil-temoignage-card">
                            <div className="accueil-temoignage-header">
                                <div className="accueil-avatar">{t.avatar}</div>
                                <div>
                                    <h4>{t.nom}</h4>
                                    <span>{t.role}</span>
                                </div>
                            </div>
                            <p>"{t.texte}"</p>
                            <div className="accueil-etoiles">★★★★★</div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />

            {/* Modal d'auth rendue conditionnellement.
                modalMode contient soit 'login' soit 'register' (sinon null = fermée). */}
            {modalMode && (
                <ModalAuth
                    mode={modalMode}
                    onFermer={() => setModalMode(null)}
                />
            )}
        </div>
    );
}