<template>
  <footer  class="hidden lg:flex footer sm:footer-horizontal bg-neutral text-neutral-content items-center p-4 justify-center z-40">
    <aside>
      <p>
        Copyright © {{ new Date().getFullYear() }} 苗栗縣立體育場
        ｜<RouterLink to="/terms" class="link link-hover">服務條款</RouterLink>
        ｜<RouterLink to="/privacy" class="link link-hover">隱私權政策</RouterLink>
        ｜<RouterLink to="/admin/login" class="link link-hover">管理登入</RouterLink>
      </p>
    </aside>
  </footer>
  
</template>