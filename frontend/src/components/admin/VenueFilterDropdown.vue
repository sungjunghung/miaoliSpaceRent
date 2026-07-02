<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import mockVenues from '@/mocks/venues.json'

const model = defineModel<number[]>({ default: () => [] })

const parentVenues = mockVenues.filter(v => v.parentId === null)
function childrenOf(parentId: number) {
  return mockVenues.filter(v => v.parentId === parentId)
}

const selectAllRef = ref<HTMLInputElement>()

const allSelected = computed(() => model.value.length === 0)
const noneSelected = computed(() => {
  if (model.value.length === 0) return false
  return mockVenues.every(v => !model.value.includes(v.id))
})
const isIndeterminate = computed(() => !allSelected.value && !noneSelected.value)

watch(isIndeterminate, (val) => {
  nextTick(() => { if (selectAllRef.value) selectAllRef.value.indeterminate = val })
})
onMounted(() => {
  nextTick(() => { if (selectAllRef.value) selectAllRef.value.indeterminate = isIndeterminate.value })
})

function toggleVenue(id: number) {
  if (model.value.length === 0) {
    // 全選 → 建立含所有 ID 的陣列，移除點擊的
    model.value = mockVenues.map(v => v.id).filter(vid => vid !== id)
  } else {
    const idx = model.value.indexOf(id)
    if (idx >= 0) {
      const next = [...model.value]
      next.splice(idx, 1)
      model.value = next
    } else {
      model.value = [...model.value, id]
    }
  }
  // 若全部都選了 → 清空代表全選
  if (mockVenues.every(v => model.value.includes(v.id))) {
    model.value = []
  }
}

function isSelected(id: number) {
  return model.value.length === 0 || model.value.includes(id)
}

function selectAll() {
  if (allSelected.value) {
    // 全選 → 全部取消（用 [-1] 標記）
    model.value = [-1]
  } else {
    // Indeterminate 或全部取消 → 全選
    model.value = []
  }
}

const filterLabel = computed(() => {
  if (noneSelected.value) return '未選場館'
  if (model.value.length === 0) return '所有場館'
  const selected = mockVenues.filter(v => model.value.includes(v.id))
  if (selected.length === 1) return selected[0].name
  return `已選 ${selected.length} 個場館`
})
</script>

<template>
  <details class="dropdown dropdown-end">
    <summary class="select">
      <span class="flex-1 text-left truncate">{{ filterLabel }}</span>
    </summary>
    <div tabindex="0"
      class="dropdown-content z-10 mt-1 bg-base-100 border border-base-200 shadow-lg rounded-box w-64">
      <ul class="menu menu-sm p-2">
        <li>
          <label class="flex items-center gap-2 select-none">
            <input ref="selectAllRef" type="checkbox" class="checkbox checkbox-sm checkbox-primary"
              :checked="allSelected" @change="selectAll" />
            <span class="font-medium">所有場館</span>
          </label>
        </li>
        <div class="divider my-0.5"></div>
        <li v-for="parent in parentVenues" :key="parent.id">
          <label class="flex items-center gap-2 select-none">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" :checked="isSelected(parent.id)"
              @change="toggleVenue(parent.id)" />
            <span class="truncate">{{ parent.name }}</span>
          </label>
          <ul v-if="childrenOf(parent.id).length">
            <li v-for="child in childrenOf(parent.id)" :key="child.id">
              <label class="flex items-center gap-2 select-none">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-primary" :checked="isSelected(child.id)"
                  @change="toggleVenue(child.id)" />
                <span class="truncate text-base-content/70">{{ child.name }}</span>
              </label>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </details>
</template>
