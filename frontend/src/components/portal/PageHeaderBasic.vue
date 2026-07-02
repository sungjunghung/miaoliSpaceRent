<script setup lang="ts">
import { computed } from 'vue'
import type { StyleValue } from 'vue'
import { publicCssImageUrl } from '@/utils/assets'

const props = defineProps<{
  title: string
  description?: string
  bgImage?: string
  bgStyle?: StyleValue
  solid?: boolean
}>()

const resolvedBgImage = computed(() => publicCssImageUrl(props.bgImage))
</script>

<template>
  <div
    class="page-header-basic"
    :class="{ 'page-header-basic--solid': solid }"
    :style="[
      bgStyle,
      !solid && resolvedBgImage ? { backgroundImage: resolvedBgImage } : undefined,
    ]"
  >
    <div class="page-header-basic__content">
      <h1 class="page-header-basic__title">{{ title }}</h1>
      <p v-if="description" class="page-header-basic__description">{{ description }}</p>
      <div v-if="$slots.default" class="page-header-basic__meta">
        <slot />
      </div>
    </div>
  </div>
</template>
