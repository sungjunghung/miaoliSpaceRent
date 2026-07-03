import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import PortalLayout from '@/layouts/PortalLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import FullScreenLayout from '@/layouts/FullScreenLayout.vue'

const router = createRouter({
  history:
    import.meta.env.PROD && import.meta.env.BASE_URL !== '/'
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    const lenis = (window as any).__lenis as { scrollTo: (target: number, opts?: any) => void } | undefined
    if (savedPosition) {
      if (lenis) {
        lenis.scrollTo(savedPosition.top, { immediate: true })
        return false
      }
      return savedPosition
    }
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
      return false
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      component: PortalLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/portal/index.vue'),
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/portal/auth/Login.vue'),
        },
        // Auth
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/portal/auth/Register.vue'),
        },
        {
          path: 'register/confirmation',
          name: 'register-confirmation',
          component: () => import('@/views/portal/auth/RegisterConfirmation.vue'),
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: () => import('@/views/portal/auth/ForgotPassword.vue'),
        },
        {
          path: 'reset-password',
          name: 'reset-password',
          component: () => import('@/views/portal/auth/ResetPassword.vue'),
        },
        // Venue
        {
          path: 'venues',
          name: 'venue-list',
          component: () => import('@/views/portal/venue/VenueList.vue'),
        },
        {
          path: 'venues/:id',
          name: 'venue-detail',
          component: () => import('@/views/portal/venue/VenueDetail.vue'),
        },
        {
          path: 'venues/:id/booking',
          name: 'venue-booking',
          component: () => import('@/views/portal/venue/VenueBooking.vue'),
        },
        {
          path: 'venues/:id/confirm',
          name: 'venue-confirm',
          component: () => import('@/views/portal/venue/VenueConfirm.vue'),
        },
        // News
        {
          path: 'news',
          name: 'news-list',
          component: () => import('@/views/portal/news/NewsList.vue'),
        },
        {
          path: 'news/:id',
          name: 'news-detail',
          component: () => import('@/views/portal/news/NewsDetail.vue'),
        },
        // Member
        {
          path: 'member',
          name: 'member',
          component: () => import('@/views/portal/member/MemberIndex.vue'),
        },
        {
          path: 'member/profile',
          name: 'my-profile',
          component: () => import('@/views/portal/member/MyProfile.vue'),
        },
        {
          path: 'member/bookings',
          name: 'my-bookings',
          component: () => import('@/views/portal/member/MyBookings.vue'),
        },
        {
          path: 'member/refunds',
          name: 'my-refunds',
          component: () => import('@/views/portal/member/MyRefunds.vue'),
        },
        {
          path: 'member/bookings/:id',
          name: 'booking-detail',
          component: () => import('@/views/portal/member/BookingDetail.vue'),
        },
        // Legal
        {
          path: 'terms',
          name: 'terms-of-service',
          component: () => import('@/views/portal/legal/TermsOfService.vue'),
        },
        {
          path: 'privacy',
          name: 'privacy-policy',
          component: () => import('@/views/portal/legal/PrivacyPolicy.vue'),
        },
        {
          path: 'faq',
          name: 'faq',
          component: () => import('@/views/portal/legal/FAQ.vue'),
        },
      ],
    },
    {
      path: '/admin/login',
      component: FullScreenLayout,
      children: [
        {
          path: '',
          name: 'admin-login',
          component: () => import('@/views/admin/login/index.vue'),
        },
      ],
    },
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        {
          path: '',
          name: 'admin-index',
          component: () => import('@/views/admin/index.vue'),
        },
        {
          path: 'venues',
          name: 'admin-venues',
          component: () => import('@/views/admin/venues/index.vue'),
        },
        {
          path: 'venues/:id/edit',
          name: 'admin-venue-edit',
          component: () => import('@/views/admin/venues/edit/index.vue'),
          redirect: { name: 'admin-venue-edit-basic' },
          children: [
            {
              path: '',
              name: 'admin-venue-edit-basic',
              component: () => import('@/views/admin/venues/edit/basic.vue'),
            },
            {
              path: 'rental',
              redirect: (to) => ({
                name: 'admin-venue-edit-rental',
                params: { id: to.params.id, mode: 'daily' },
              }),
            },
            {
              path: 'rental/:mode(daily|session|hourly)',
              name: 'admin-venue-edit-rental',
              component: () => import('@/views/admin/venues/edit/rental.vue'),
            },
            {
              path: 'rental-items',
              name: 'admin-venue-edit-rental-items',
              component: () => import('@/views/admin/venues/edit/rental-items.vue'),
            },
            {
              path: 'photos',
              name: 'admin-venue-edit-photos',
              component: () => import('@/views/admin/venues/edit/photos.vue'),
            },
          ],
        },
        {
          path: 'calendar',
          name: 'admin-calendar',
          component: () => import('@/views/admin/calendar/index.vue'),
        },
        {
          path: 'bookings',
          name: 'admin-bookings',
          component: () => import('@/views/admin/bookings/index.vue'),
        },
        {
          path: 'bookings/:id',
          name: 'admin-booking-detail',
          component: () => import('@/views/admin/bookings/detail.vue'),
        },
        {
          path: 'refunds',
          name: 'admin-refunds',
          component: () => import('@/views/admin/refunds/index.vue'),
        },
        {
          path: 'members',
          name: 'admin-members',
          component: () => import('@/views/admin/members/index.vue'),
        },
        {
          path: 'members/:id',
          name: 'admin-member-detail',
          component: () => import('@/views/admin/members/detail.vue'),
        },
        {
          path: 'admins',
          name: 'admin-admins',
          component: () => import('@/views/admin/admins/index.vue'),
        },
        {
          path: 'admins/:id',
          name: 'admin-admin-detail',
          component: () => import('@/views/admin/admins/detail.vue'),
        },
        {
          path: 'permissions',
          name: 'admin-permissions',
          component: () => import('@/views/admin/permissions/index.vue'),
        },
        {
          path: 'permissions/:id',
          name: 'admin-permission-detail',
          component: () => import('@/views/admin/permissions/detail.vue'),
        },
        {
          path: 'profile',
          name: 'admin-profile',
          component: () => import('@/views/admin/profile/index.vue'),
        },
        {
          path: 'reports',
          name: 'admin-reports',
          component: () => import('@/views/admin/reports/index.vue'),
        },
        {
          path: 'news',
          name: 'admin-news',
          component: () => import('@/views/admin/news/index.vue'),
        },
        {
          path: 'news/:id',
          name: 'admin-news-edit',
          component: () => import('@/views/admin/news/edit.vue'),
        },
      ],
    },
  ],
})

export default router
