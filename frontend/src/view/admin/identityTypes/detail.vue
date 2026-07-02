<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IdentityTypeDetailContent from './components/IdentityTypeDetailContent.vue'

const route = useRoute()
const router = useRouter()
const typeId = computed(() => route.params.id as string)
</script>

<template>
  <IdentityTypeDetailContent :id="typeId" @close="router.push({ name: 'admin-identity-types' })" />
</template>
