<script setup lang="ts">
// 身份價格表：「一般民眾」為基準列，可自訂新增身份
// pricing 為響應式物件（整日/計時的 ModePricing 或單一時段 SessionDef），直接就地修改
interface IdentityRow {
  label: string;
  weekday: number;
  weekend: number;
}

const props = defineProps<{
  pricing: { weekday: number; weekend: number; identityRows: IdentityRow[] };
  weekendPricingEnabled: boolean;
}>();

function formatPrice(value: number) {
  return Math.max(0, value).toLocaleString('en-US');
}

function parsePriceInput(value: string) {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly === '' ? 0 : Number(digitsOnly);
}

function updatePrice(event: Event, apply: (value: number) => void) {
  const input = event.target as HTMLInputElement;
  const nextValue = parsePriceInput(input.value);
  apply(nextValue);
  input.value = formatPrice(nextValue);
}

function addRow() {
  props.pricing.identityRows.push({ label: '', weekday: 0, weekend: 0 });
}

function removeRow(index: number) {
  props.pricing.identityRows.splice(index, 1);
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table table-sm w-full">
      <thead>
        <tr>
          <th>身份別</th>
          <th>平日價</th>
          <th v-if="weekendPricingEnabled">假日價</th>
          <th class="w-px"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input type="text" value="一般民眾" class="input" disabled /></td>
          <td>
            <label class="input w-auto">
              NT$
              <input
                :value="formatPrice(pricing.weekday)"
                type="text"
                inputmode="numeric"
                class="grow text-end"
                @input="updatePrice($event, (value) => (pricing.weekday = value))"
              />
              <span>元</span>
            </label>
          </td>
          <td v-if="weekendPricingEnabled">
            <label class="input w-auto">
              NT$
              <input
                :value="formatPrice(pricing.weekend)"
                type="text"
                inputmode="numeric"
                class="grow text-end"
                @input="updatePrice($event, (value) => (pricing.weekend = value))"
              />
              <span>元</span>
            </label>
          </td>
          <td></td>
        </tr>
        <tr v-for="(row, i) in pricing.identityRows" :key="i">
          <td><input v-model="row.label" type="text" placeholder="例如：在地居民" class="input" /></td>
          <td>
            <label class="input w-auto">
              NT$
              <input
                :value="formatPrice(row.weekday)"
                type="text"
                inputmode="numeric"
                class="grow text-end"
                @input="updatePrice($event, (value) => (row.weekday = value))"
              />
              <span>元</span>
            </label>
          </td>
          <td v-if="weekendPricingEnabled">
            <label class="input w-auto">
              NT$
              <input
                :value="formatPrice(row.weekend)"
                type="text"
                inputmode="numeric"
                class="grow text-end"
                @input="updatePrice($event, (value) => (row.weekend = value))"
              />
              <span>元</span>
            </label>
          </td>
          <td>
            <button type="button" class="btn btn-error btn-ghost btn-square btn-sm" @click="removeRow(i)">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <button type="button" class="btn btn-neutral btn-sm w-fit mt-2" @click="addRow">＋ 新增身份</button>
</template>
