import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ScoreView from '../views/ScoreView.vue'
import PresentationView from '../views/PresentationView.vue'
import ExportView from '../views/ExportView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/score',
      name: 'score',
      component: ScoreView
    },
    {
      path: '/presentation',
      name: 'presentation',
      component: PresentationView
    },
    {
      path: '/export',
      name: 'export',
      component: ExportView
    }
  ]
})

export default router