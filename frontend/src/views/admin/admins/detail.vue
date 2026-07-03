<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminDetailContent from './components/AdminDetailContent.vue'

const route = useRoute()
const router = useRouter()

const adminId = computed(() => route.params.id as string)
</script>

<template>
  <AdminDetailContent :id="adminId" page-layout @close="router.push({ name: 'admin-admins' })" />
</template>
