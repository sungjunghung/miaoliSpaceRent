<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PermissionDetailContent from './components/PermissionDetailContent.vue'

const route = useRoute()
const router = useRouter()
const groupId = computed(() => route.params.id as string)
</script>

<template>
    <PermissionDetailContent :id="groupId" page-layout @close="router.push({ name: 'admin-permissions' })" />
</template>
