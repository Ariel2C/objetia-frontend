"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Headphones, 
  ArrowRight,
  Heart,
  Package,
  ShoppingBag,
  PlusCircle,
  MessageSquare
} from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const isRootTab = pathname === '/root/dashboard' || ((pathname === '/mi-objetia' || pathname === '/mi-espacio') && tab === 'root');

  if (isRootTab) return null;
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 pt-12 pb-24 md:pb-12 mt-16">
      {/* SECCIÓN DE BENEFICIOS Y CONFIANZA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 border-b border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-800/50 border border-gray-800">
            <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Envíos a todo el país</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Despachos asegurados a domicilio</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-800/50 border border-gray-800">
            <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compra Protegida</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Garantía de reembolso de 10 días</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-800/50 border border-gray-800">
            <div className="p-3 bg-amber-600/10 text-amber-400 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Múltiples Medios de Pago</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Tarjetas, transferencias y cuotas</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-800/50 border border-gray-800">
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Soporte Directo</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Atención personalizada y chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* ENLACES Y NAVEGACIÓN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* COLUMNA 1 & 2: MARCA E IDENTIDAD */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
                <Image
                  src="/objetia_logo.png"
                  alt="Objetia Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover rounded-[10px]"
                />
              </div>
              <span 
                className="text-2xl font-black tracking-widest text-white uppercase"
                style={{ fontFamily: 'var(--font-family-brand, Outfit)' }}
              >
                OBJETIA
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              La plataforma exclusiva de decoración de interiores, mobiliario y objetos de diseño premium. Conectamos compradores y vendedores apasionados por la estética del hogar.
            </p>

            <div className="pt-2">
              <Link 
                href="/products/new"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('vamaar:open-vender-modal'));
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#202124] hover:bg-[#000000] text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Vender un Producto
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
          </div>

          {/* COLUMNA 3: CATÁLOGO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Explorar Catálogo</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/catalog" className="text-gray-400 hover:text-white transition">Todos los Productos</Link></li>
              <li><Link href="/catalog?category=Sillones" className="text-gray-400 hover:text-white transition">Sillones y Sofás</Link></li>
              <li><Link href="/catalog?category=Iluminación" className="text-gray-400 hover:text-white transition">Iluminación de Diseño</Link></li>
              <li><Link href="/catalog?category=Mesas" className="text-gray-400 hover:text-white transition">Mesas y Comedores</Link></li>
              <li><Link href="/catalog?category=Decoración" className="text-gray-400 hover:text-white transition">Decoración y Arte</Link></li>
              <li><Link href="/products/favorites" className="text-gray-400 hover:text-white transition flex items-center gap-1.5"><Heart className="h-3 w-3 text-red-400" /> Mis Favoritos</Link></li>
            </ul>
          </div>

          {/* COLUMNA 4: MI CUENTA */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mi Objetia</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/mi-objetia" className="text-gray-400 hover:text-white transition">Panel General</Link></li>
              <li><Link href="/mi-objetia?tab=publications" className="text-gray-400 hover:text-white transition flex items-center gap-1.5"><Package className="h-3 w-3 text-purple-400" /> Mis Publicaciones</Link></li>
              <li><Link href="/mi-objetia?tab=purchases" className="text-gray-400 hover:text-white transition flex items-center gap-1.5"><ShoppingBag className="h-3 w-3 text-emerald-400" /> Mis Compras</Link></li>
              <li><Link href="/chat" className="text-gray-400 hover:text-white transition flex items-center gap-1.5"><MessageSquare className="h-3 w-3 text-blue-400" /> Mis Mensajes</Link></li>
              <li><Link href="/mi-objetia?tab=billetera" className="text-gray-400 hover:text-white transition">Mi Billetera</Link></li>
            </ul>
          </div>

          {/* COLUMNA 5: HERRAMIENTAS Y SERVICIOS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Servicios y Envíos</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/shipping/tracking" className="text-gray-400 hover:text-white transition">Seguimiento de Paquetes</Link></li>
              <li><Link href="/simulador-correo" className="text-gray-400 hover:text-white transition">Simulador de Envíos</Link></li>
              <li><Link href="/auth" className="text-gray-400 hover:text-white transition">Iniciar Sesión / Registro</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* BARRA INFERIOR DE COPYRIGHT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} <span className="font-bold text-gray-300">Objetia</span>. Todos los derechos reservados.</p>
        <div className="flex items-center gap-6">
          <Link href="/catalog" className="hover:text-gray-300 transition">Términos del Servicio</Link>
          <Link href="/catalog" className="hover:text-gray-300 transition">Privacidad</Link>
          <Link href="/catalog" className="hover:text-gray-300 transition">Ayuda</Link>
        </div>
      </div>
    </footer>
  );
}
