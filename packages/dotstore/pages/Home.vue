<!-- <script setup>
import { computed } from "vue"
import { useProductsStore } from "@/stores/products"
import ProductCard from "@/components/product/ProductCard.vue"

const productsStore = useProductsStore()

const products = computed(() => productsStore.products)
</script> -->

<template>
  <section class="px-4 py-6 lg:px-12 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl lg:text-2xl font-semibold">Discover</h1>

      <!-- Desktop filter trigger -->
      <button
        class="hidden lg:flex items-center gap-2 text-sm font-medium opacity-80 hover:opacity-100"
      >
        Filters
      </button>
    </div>

    <!-- Category chips -->
    <div class="flex gap-3 overflow-x-auto mb-6 pb-1">
      <button
        v-for="tag in ['All', 'Men', 'Women', 'Shoes', 'Accessories']"
        :key="tag"
        class="shrink-0 px-4 py-2 rounded-full border text-sm hover:bg-black hover:text-white transition"
      >
        TAG
      </button>
    </div>

    <!-- Product grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      <!-- <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      /> -->
    </div>
  </section>
</template>
