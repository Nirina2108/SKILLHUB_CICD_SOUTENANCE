import { useEffect, useRef, useState } from 'react';

/**
 * Hook custom pour déclencher une animation quand un élément devient visible
 * lors du scroll. Utilise l'API Intersection Observer (native, sans dépendance).
 *
 * Usage :
 *   const [ref, visible] = useScrollAnimation();
 *   <div ref={ref} className={visible ? 'animer' : ''}>...</div>
 *
 * @param {object} options Options de l'observer (threshold, rootMargin)
 * @returns {[React.RefObject, boolean]} Ref à attacher + drapeau visibilité
 */
export default function useScrollAnimation(options = { threshold: 0.15 }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Crée un observer qui surveille l'entrée dans le viewport.
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                // On cesse d'observer après la première apparition (animation one-shot).
                observer.unobserve(element);
            }
        }, options);

        observer.observe(element);

        // Cleanup au démontage.
        return () => observer.disconnect();
    }, []);

    return [ref, visible];
}
