import {defineConfig} from 'vite';
export default defineConfig({server:{port:4102,strictPort:true,proxy:{'/api':'http://127.0.0.1:4202','/health':'http://127.0.0.1:4202'}},build:{outDir:'dist'}});