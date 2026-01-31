<template>
  <div class="min-h-screen bg-[#F5F7FA] flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-6">
      <div class="flex items-center gap-3">
        <img src="https://i.pravatar.cc/100" class="w-12 h-12 rounded-full" />
        <div>
          <p class="text-lg font-semibold text-[#1E293B]">Welcome Beebah</p>
          <p class="text-sm text-gray-500">Send airtime and data easily</p>
        </div>
      </div>

      <button class="text-2xl text-gray-600">
        <i class="i-lucide-bell"></i>
      </button>
    </div>

    <!-- Wallet Card -->
    <div class="px-5 mt-6">
      <div class="bg-[#1F2937] text-white rounded-3xl p-6 shadow-lg">
        <p class="text-sm opacity-80 mb-2">Wallet balance</p>

        <div class="flex items-center justify-between">
          <h1 class="text-4xl font-bold tracking-wide">₦50,000.00</h1>
          <i class="i-lucide-eye-off text-xl opacity-70"></i>
        </div>

        <div class="flex gap-4 mt-6">
          <button
            class="flex-1 bg-white/10 rounded-full py-3 flex items-center justify-center gap-2"
          >
            <i class="i-lucide-plus"></i>
            <span>Add fund</span>
          </button>

          <button
            class="flex-1 bg-white text-[#1F2937] rounded-full py-3 flex items-center justify-center gap-2 font-medium"
          >
            <i class="i-lucide-wallet"></i>
            <span>Withdraw fund</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="px-5 mt-6">
      <div
        class="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm"
      >
        <button class="flex-1 flex flex-col items-center gap-2">
          <div
            class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <i class="i-lucide-signal text-xl"></i>
          </div>
          <span class="text-sm font-medium">Send airtime</span>
        </button>

        <span class="text-gray-400 font-medium">or</span>

        <button class="flex-1 flex flex-col items-center gap-2">
          <div
            class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <i class="i-lucide-wifi text-xl"></i>
          </div>
          <span class="text-sm font-medium">Send data</span>
        </button>
      </div>
    </div>

    <!-- Transactions -->
    <div class="px-5 mt-8 flex-1">
      <h2 class="text-xl font-semibold text-[#1E293B] mb-4">Transactions</h2>

      <div class="space-y-4">
        <div v-for="transaction in transactions">
          <div
            class="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div class="flex items-center gap-3">
              <img
                src="https://storage.googleapis.com/great-unknown.appspot.com/images/finance/zendaa/mtn.jpg"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p class="font-semibold text-[#1E293B]">Airtime To NG</p>
                <p class="text-sm text-gray-500">{{ transaction.recipient }}</p>
              </div>
            </div>

            <div class="text-right">
              <p class="font-semibold text-[#1E293B]">
                {{ transaction.amount }}
              </p>
              <p
                class="text-sm font-medium"
                :class="
                  transaction.status === 'success'
                    ? 'text-green-600'
                    : 'text-red-500'
                "
              >
                {{ transaction.status === "success" ? "Success" : "Failed" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Nav -->
    <div
      class="sticky bottom-0 bg-white shadow-inner rounded-t-3xl py-3 px-10 flex justify-between items-center"
    >
      <button class="text-green-700 text-2xl">
        <i class="i-lucide-home"></i>
      </button>
      <button class="text-gray-400 text-2xl">
        <i class="i-lucide-user"></i>
      </button>
      <button class="text-gray-400 text-2xl">
        <i class="i-lucide-settings"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useStore } from "@/store";

const { user } = useStore();

const { transactions } = user;
</script>
