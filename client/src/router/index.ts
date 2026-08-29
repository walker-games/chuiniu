import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/lobby/:roomId',
      name: 'Lobby',
      component: () => import('@/views/Lobby.vue'),
    },
    {
      path: '/game/:roomId',
      name: 'Game',
      component: () => import('@/views/Game.vue'),
    },
    {
      path: '/result/:roomId',
      name: 'Result',
      component: () => import('@/views/Result.vue'),
    },
    {
      path: '/history',
      name: 'History',
      component: () => import('@/views/History.vue'),
    },
  ],
})

export default router
