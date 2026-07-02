import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import protalLayout from '../layout/protalLayout.vue'
import adminLayout from '../layout/adminLayout.vue'
import FullScreenLayout from '../layout/FullScreenLayout.vue'

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
      component: protalLayout,
      children: [
        {
          path: '',
          name: 'portal-index',
          component: () => import('../view/portal/index.vue'),
        },
        {
          path: 'login',
          name: 'portal-login',
          component: () => import('../view/portal/auth/Login.vue'),
        },
        // Auth
        {
          path: 'register',
          name: 'register',
          component: () => import('../view/portal/auth/Register.vue'),
        },
        {
          path: 'register/confirmation',
          name: 'register-confirmation',
          component: () => import('../view/portal/auth/RegisterConfirmation.vue'),
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: () => import('../view/portal/auth/ForgotPassword.vue'),
        },
        {
          path: 'reset-password',
          name: 'reset-password',
          component: () => import('../view/portal/auth/ResetPassword.vue'),
        },
        // Venue
        {
          path: 'venues',
          name: 'venue-list',
          component: () => import('../view/portal/Venue/VenueList.vue'),
        },
        {
          path: 'venues/:id',
          name: 'venue-detail',
          component: () => import('../view/portal/Venue/VenueDetail.vue'),
        },
        {
          path: 'venues/:id/booking',
          name: 'venue-booking',
          component: () => import('../view/portal/Venue/VenueBooking.vue'),
        },
        {
          path: 'venues/:id/confirm',
          name: 'venue-confirm',
          component: () => import('../view/portal/Venue/VenueConfirm.vue'),
        },
        // News
        {
          path: 'news',
          name: 'news-list',
          component: () => import('../view/portal/news/NewsList.vue'),
        },
        {
          path: 'news/:id',
          name: 'news-detail',
          component: () => import('../view/portal/news/NewsDetail.vue'),
        },
        // Member
        {
          path: 'member',
          name: 'member-index',
          component: () => import('../view/portal/member/MemberIndex.vue'),
        },
        {
          path: 'member/profile',
          name: 'my-profile',
          component: () => import('../view/portal/member/MyProfile.vue'),
        },
        {
          path: 'member/bookings',
          name: 'my-bookings',
          component: () => import('../view/portal/member/MyBookings.vue'),
        },
        {
          path: 'member/refunds',
          name: 'my-refunds',
          component: () => import('../view/portal/member/MyRefunds.vue'),
        },
        {
          path: 'member/bookings/:id',
          name: 'booking-detail',
          component: () => import('../view/portal/member/BookingDetail.vue'),
        },
        // Legal
        {
          path: 'terms',
          name: 'terms-of-service',
          component: () => import('../view/portal/Legal/TermsOfService.vue'),
        },
        {
          path: 'privacy',
          name: 'privacy-policy',
          component: () => import('../view/portal/Legal/PrivacyPolicy.vue'),
        },
        {
          path: 'faq',
          name: 'faq',
          component: () => import('../view/portal/Legal/FAQ.vue'),
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
          component: () => import('../view/admin/login.vue'),
        },
      ],
    },
    {
      path: '/admin',
      component: adminLayout,
      children: [
        {
          path: '',
          name: 'admin-index',
          component: () => import('../view/admin/index.vue'),
        },
        {
          path: 'venues',
          name: 'admin-venues',
          component: () => import('../view/admin/venues/index.vue'),
        },
        {
          path: 'venues/:id/edit',
          name: 'admin-venue-edit',
          component: () => import('../view/admin/venues/edit.vue'),
          redirect: { name: 'admin-venue-edit-basic' },
          children: [
            {
              path: '',
              name: 'admin-venue-edit-basic',
              component: () => import('../view/admin/venues/edit/basic.vue'),
            },
            {
              path: 'rental',
              name: 'admin-venue-edit-rental',
              component: () => import('../view/admin/venues/edit/rental.vue'),
            },
            {
              path: 'rental-items',
              name: 'admin-venue-edit-rental-items',
              component: () => import('../view/admin/venues/edit/rentalItems.vue'),
            },
            {
              path: 'photos',
              name: 'admin-venue-edit-photos',
              component: () => import('../view/admin/venues/edit/photos.vue'),
            },
          ],
        },
        {
          path: 'venues/calendar',
          name: 'admin-venues-calendar',
          component: () => import('../view/admin/venues/calendar.vue'),
        },
        {
          path: 'bookings',
          name: 'admin-bookings',
          component: () => import('../view/admin/bookings/index.vue'),
        },
        {
          path: 'bookings/:id',
          name: 'admin-booking-detail',
          component: () => import('../view/admin/bookings/detail.vue'),
        },
        {
          path: 'refunds',
          name: 'admin-refunds',
          component: () => import('../view/admin/refunds.vue'),
        },
        {
          path: 'members',
          name: 'admin-members',
          component: () => import('../view/admin/members/index.vue'),
        },
        {
          path: 'members/:id',
          name: 'admin-member-detail',
          component: () => import('../view/admin/members/detail.vue'),
        },
        {
          path: 'admins',
          name: 'admin-admins',
          component: () => import('../view/admin/admins/index.vue'),
        },
        {
          path: 'admins/:id',
          name: 'admin-admin-detail',
          component: () => import('../view/admin/admins/detail.vue'),
        },
        {
          path: 'permissions',
          name: 'admin-permissions',
          component: () => import('../view/admin/permissions/index.vue'),
        },
        {
          path: 'permissions/:id',
          name: 'admin-permission-detail',
          component: () => import('../view/admin/permissions/detail.vue'),
        },
        {
          path: 'profile',
          name: 'admin-profile',
          component: () => import('../view/admin/profile.vue'),
        },
        {
          path: 'reports',
          name: 'admin-reports',
          component: () => import('../view/admin/reports.vue'),
        },
        {
          path: 'news',
          name: 'admin-news',
          component: () => import('../view/admin/news/index.vue'),
        },
        {
          path: 'news/:id',
          name: 'admin-news-edit',
          component: () => import('../view/admin/news/edit.vue'),
        },
      ],
    },
  ],
})

export default router
