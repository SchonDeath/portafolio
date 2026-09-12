import { ref } from 'vue'
import type { Project } from '@/data/profile'
import { projects } from '@/data/profile'

/**
 * Estado del overlay de proyecto a pantalla completa, compartido entre
 * la sección de proyectos (que lo abre) y App.vue (que lo renderiza al
 * nivel más alto, por encima de todo el resto del sitio). Vive a nivel
 * de módulo por la misma razón que el tema: un solo estado real, no una
 * copia por cada componente que lo consulte.
 */
const activeProject = ref<Project | null>(null)

export function useProjectOverlay() {
  const open = (project: Project) => {
    activeProject.value = project
  }

  const close = () => {
    activeProject.value = null
  }

  const activeIndex = () =>
    activeProject.value ? projects.findIndex((p) => p.id === activeProject.value!.id) : -1

  return { activeProject, open, close, activeIndex }
}
