<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MemberDetailContent from './components/MemberDetailContent.vue'

const route = useRoute()
const router = useRouter()
const memberId = computed(() => route.params.id as string)
</script>

<template>
    <MemberDetailContent :id="memberId" page-layout @close="router.push({ name: 'admin-members' })" />
</template>
