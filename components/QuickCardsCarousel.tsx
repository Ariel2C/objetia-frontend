"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { QuickAccessCard } from '../lib/types';

// ==============================================================================
// ILUSTRACIONES VECTORIALES PROFESIONALES DE ACCESO RÁPIDO (ESTILO OBJETIA / SPOT ART)
// ==============================================================================

// 1. Ingresá a tu cuenta: Ventana de escritorio y tarjeta con avatar de usuario
function LoginIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 105 105" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[90px] md:h-[90px]"><circle cx="53" cy="53" r="45.54" fill="#eee"/><path fill="#ffe600" stroke="#fff" strokeWidth="3.938" d="M6.118 26.803h92.455V85.69c0 .79-.608 1.33-1.235 1.33H7.353c-.628 0-1.235-.54-1.235-1.33z"/><path stroke="#333" strokeWidth="1.969" d="M4.15 49.063V85.69c0 1.822 1.433 3.3 3.203 3.3h89.985c1.77 0 3.204-1.478 3.204-3.3v-1.847M4.149 44.018V24.834h96.393v44.47m0 5.352v3.938"/><path fill="#fff" fillRule="evenodd" stroke="#333" strokeWidth="1.969" d="M7.353 15.594h90.003c1.77 0 3.203 1.516 3.203 3.387v5.62H4.149v-5.62c0-1.87 1.435-3.387 3.204-3.387Z" clipRule="evenodd"/><circle cx="11.052" cy="20.098" r="1.525" fill="#333"/><circle cx="17.891" cy="20.098" r="1.525" fill="#333"/><circle cx="24.982" cy="20.098" r="1.525" fill="#333"/><path fill="#fff" stroke="#fff" strokeWidth="3.938" d="M69.136 56.912c0 9.445-7.544 17.055-16.79 17.055-9.248 0-16.791-7.61-16.791-17.055s7.543-17.054 16.79-17.054 16.79 7.61 16.79 17.054Z"/><ellipse cx="52.345" cy="56.912" stroke="#333" strokeWidth="1.969" rx="18.759" ry="19.023"/><path stroke="#333" strokeWidth="1.969" d="M44.149 66.468v-.91a4.49 4.49 0 0 1 4.49-4.491h7.389a4.514 4.514 0 0 1 4.513 4.514v.91"/><path stroke="#333" strokeWidth="1.969" d="M52.352 47.333a5.52 5.52 0 1 1 0 11.04 5.52 5.52 0 0 1 0-11.04Z" clipRule="evenodd"/></svg>
  );
}

// 2. Más vendidos: Zapatillas deportivas, bolsas de compras y etiqueta de precio (Referencia exacta)
function BestsellersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 105 105" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[90px] md:h-[90px]"><circle cx="53" cy="53" r="45.54" fill="#eee"/><path stroke="#333" strokeWidth="1.969" d="M43.399 30.944V19.765a7.45 7.45 0 0 1 7.452-7.453h4.077a7.45 7.45 0 0 1 7.452 7.453v11.179"/><mask id="top_a" fill="#fff"><path fillRule="evenodd" d="M40.718 25.72a.656.656 0 0 1 .656-.64h46.571c.331 0 .61.246.652.574l7.705 61.78a.656.656 0 0 1-.65.737l-55.662.143a.656.656 0 0 1-.657-.671z" clipRule="evenodd"/></mask><path fill="#ffe600" fillRule="evenodd" d="M40.718 25.72a.656.656 0 0 1 .656-.64h46.571c.331 0 .61.246.652.574l7.705 61.78a.656.656 0 0 1-.65.737l-55.662.143a.656.656 0 0 1-.657-.671z" clipRule="evenodd"/><path fill="#fff" d="m39.99 88.314-.01-3.938zm56.312-.88 3.907-.488zm-.65.737.01 3.937zm-7.055-62.517 3.907-.487zm-47.223 3.363h46.571v-7.875h-46.57zm43.315-2.875 7.706 61.779 7.814-.975-7.705-61.779zm10.953 58.091-55.662.143.02 7.875 55.662-.143zM43.27 87.731l1.386-61.922-7.873-.176-1.386 61.922zm-3.289-3.355a3.28 3.28 0 0 1 3.29 3.355l-7.874-.176A4.594 4.594 0 0 0 40 92.25zm52.415 3.545a3.28 3.28 0 0 1 3.247-3.688l.02 7.875a4.593 4.593 0 0 0 4.547-5.162zm-4.45-58.904a3.28 3.28 0 0 1-3.256-2.875l7.815-.975a4.594 4.594 0 0 0-4.559-4.025zm-46.57-7.875a4.594 4.594 0 0 0-4.593 4.49l7.873.177a3.28 3.28 0 0 1-3.28 3.208z" mask="url(#top_a)"/><path fill="#fff" stroke="#fff" strokeWidth="3.938" d="m29.655 26.879-.006-1.361.006 1.36m0 0-.251-.073a2 2 0 0 0 .25.074m.001 0v.17h-.007M18.087 87.871l.003-1.603zm2.02-1.668L31.363 27.04l.81-.004h.278l.028-.001h.171l.03-.001h.203l.03-.001h.177l1.993-.01 3.41-.016-.014.708-.138 7.18-.417 21.779c-.15 7.917-.3 15.832-.408 21.76a5967 5967 0 0 0-.14 7.86q-.604-.008-1.339-.014c-1.993-.02-4.652-.034-7.31-.046s-5.317-.021-7.311-.027zM29.36 27.03l.134.017a6 6 0 0 0 .754.036h.005c.041-.002.172-.007.34-.04z"/><path stroke="#333" strokeWidth="1.969" d="M86.935 87.696a.296.296 0 0 1-.237.472H18.086a.296.296 0 0 1-.29-.351L24.42 53m21.7-27.92H29.646c-.083 0 .65.078.607.007a.296.296 0 0 0-.542.1L25.419 47.75"/><path stroke="#333" strokeWidth="1.969" d="M29.64 25.32a.296.296 0 0 1 .543-.1l4.116 6.69a.296.296 0 0 0 .48.033l5.41-6.492a.296.296 0 0 1 .465.013m53.236 42.63-5.293-42.44a.656.656 0 0 0-.652-.575h-46.57a.656.656 0 0 0-.657.642l-1.385 61.922a.656.656 0 0 0 .657.67l55.663-.142a.656.656 0 0 0 .649-.738l-.587-4.708m-1.17-9.381.49 3.937m-77.01 11.034 11.977-6.506 9.316 6.506m-9.464-6.505 4.908-49.622"/><path stroke="#333" strokeWidth="1.969" d="M57.061 30.944V19.765a7.45 7.45 0 0 1 7.453-7.453h4.077a7.45 7.45 0 0 1 7.452 7.453v11.179"/><path fill="#fff" fillRule="evenodd" stroke="#333" strokeWidth="1.969" d="M87.057 39.224c.175 0 .342.07.466.194l14.27 14.343a.656.656 0 0 1-.001.927L89.774 66.706a.656.656 0 0 1-.93-.001L74.56 52.347a.66.66 0 0 1-.19-.425l-.706-12.003a.656.656 0 0 1 .655-.695z" clipRule="evenodd"/><circle cx="81.648" cy="46.688" r="2.636" fill="#fff" stroke="#333" strokeWidth="1.969"/><path stroke="#333" strokeWidth="1.969" d="M71.552 25.029c2.958-4.14 7.353-1.68 8.906 1.266 2.33 4.418 2.912 10.309 1.165 20.618"/><path fill="#fff" fillRule="evenodd" d="M54.72 62.65c.775 1.303 1.85 2.413 4.538 2.427 3.562.146 4.705-1.767 5.154-2.822.45-1.056 1.02-3.237 4.693-3.16 2.606.054 3.876 2.088 4.395 3.264.189.43.307.888.367 1.357l.087.698.833 6.687.517 8.588s.728.227.728 1.836v5.06c0 .925-.81 2.175-1.98 2.175H20.44c-6.893 0-13.219-2.156-14.467-5.406a3.3 3.3 0 0 1-.222-1.182c0-2.595 1.426-4.221 2.38-5.02a4 4 0 0 1 1.453-.772c1.587-.471 5.927-1.785 8.897-2.948 1.212-.474 3.698-1.6 6.683-3.012 0 0 14.383-6.938 18.875-9.606 0 0 .328-.207.46-.296 4.697-3.2 8.29-6.77 9.884-8.46a1.162 1.162 0 0 1 1.827.161c.563.838 1.214 2.094 1.426 3.638.397 3.16-1.61 6.28-3.107 6.975" clipRule="evenodd"/><path stroke="#333" strokeWidth="1.969" d="M54.72 62.65c.775 1.303 1.85 2.413 4.538 2.427 3.562.146 4.705-1.767 5.154-2.822.45-1.056 1.02-3.237 4.693-3.16 2.606.054 3.876 2.088 4.395 3.264.189.43.307.888.367 1.357l.087.698.833 6.687.517 8.588s.728.227.728 1.836v5.06c0 .925-.81 2.175-1.98 2.175H20.44c-6.893 0-13.219-2.156-14.467-5.406a3.3 3.3 0 0 1-.222-1.182c0-2.595 1.426-4.221 2.38-5.02a4 4 0 0 1 1.453-.772c1.587-.471 5.927-1.785 8.897-2.948 1.212-.474 3.698-1.6 6.683-3.012 0 0 14.383-6.938 18.875-9.606 0 0 .328-.207.46-.296 4.697-3.2 8.29-6.77 9.884-8.46a1.162 1.162 0 0 1 1.827.161c.563.838 1.214 2.094 1.426 3.638.397 3.16-1.61 6.28-3.107 6.975"/><path stroke="#333" strokeWidth="1.969" d="M75.454 79.69c-.153.031-11.206.064-11.352.097-2.548.585-2.171 1.314-3.435 2.433-1.235 1.094-2.552 1.562-3.622 1.398l-50.716.741M18 73.57a9.23 9.23 0 0 0 7.224.56c5.272-1.776 17.039-6.832 20.98-9.073 1.396-.794 1.6-2.532 2.067-3.737.312-.804.836-1.505 1.544-1.937.765-.468 1.805-.706 2.906.206 1.02.846 1.458 2.102 2.125 3.21"/><path fill="#ffe600" stroke="#fff" strokeWidth="3.938" d="m31.63 73.815 5.888 8.15 11.162-.157-11.51-10.156z"/><path stroke="#333" strokeWidth="1.969" d="m36.522 83.949-6.51-9.011-1.468-2.032 9.029-3.525 16.232 14.324z" clipRule="evenodd"/><path stroke="#333" strokeWidth="1.969" d="M10.401 76.061c.268.309.574.62.919.913.448.38.962.725 1.543.986 2.572 1.154 4.287.178 9.175 1.509 1.745.476 3.053 1.789 4.013 3.28.252.392.48.795.686 1.2m14.438-17.396-4.08-6.346m-2.035 9.174-4.08-6.345m-2.4 9.814-4.08-6.345"/></svg>
  );
}

// 3. Menos de $30.000: Moneda con símbolo $, flecha de descuento hacia abajo y fajos de billetes
function Under30kIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 105 105" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[90px] md:h-[90px]"><g clipPath="url(#low_a)"><circle cx="53" cy="53" r="45.54" fill="#eee"/><ellipse cx="53.468" cy="35.404" fill="#fff" rx="25.102" ry="25.456"/><path fill="#ffe600" stroke="#fff" strokeWidth="3.938" d="M70.259 35.404c0 9.445-7.544 17.055-16.79 17.055-9.248 0-16.791-7.61-16.791-17.055S44.22 18.35 53.468 18.35s16.79 7.61 16.79 17.054Z"/><path stroke="#333" strokeWidth="1.969" d="M58.257 30.162c-.69-1.569-2.248-2.534-4.975-2.534-2.856 0-4.978 1.614-4.978 3.98 0 2.932 1.73 3.526 4.36 4.226l.495.136.328.093c2.115.604 4.77 1.189 5.003 3.542.234 2.354-1.627 4.45-5.398 4.441-2.666-.006-4.919-1.263-5.322-3.249m5.593-16.067v2.896m0 16.621v2.896"/><ellipse cx="53.468" cy="35.403" stroke="#333" strokeWidth="1.969" rx="18.759" ry="19.023"/><mask id="low_b" fill="#fff"><rect width="50.205" height="10.001" x="32.364" y="85.382" rx="1.313"/></mask><rect width="50.205" height="10.001" x="32.364" y="85.382" fill="#fff" stroke="#fff" strokeWidth="5.25" mask="url(#low_b)" rx="1.313"/><rect width="50.205" height="10.001" x="32.364" y="85.382" stroke="#333" strokeWidth="1.969" rx="1.313"/><mask id="low_c" fill="#fff"><rect width="50.205" height="10.001" x="24.368" y="75.381" rx="1.313"/></mask><rect width="50.205" height="10.001" x="24.368" y="75.381" fill="#fff" stroke="#fff" strokeWidth="5.25" mask="url(#low_c)" rx="1.313"/><rect width="50.205" height="10.001" x="24.368" y="75.381" stroke="#333" strokeWidth="1.969" rx="1.313"/><mask id="low_d" fill="#fff"><rect width="50.205" height="10.001" x="29.698" y="65.38" rx="1.313"/></mask><rect width="50.205" height="10.001" x="29.698" y="65.38" fill="#fff" stroke="#fff" strokeWidth="5.25" mask="url(#low_d)" rx="1.313"/><rect width="50.205" height="10.001" x="29.698" y="65.38" stroke="#333" strokeWidth="1.969" rx="1.313"/><path stroke="#333" strokeWidth="1.969" d="M30.914 77.716v5.331m7.548-5.329v5.33m7.548-5.33v5.33m7.548-5.33v5.33m7.548-5.33v5.33m7.548-5.33v5.33m-29.744 4.69v5.33m7.547-5.329v5.331m7.548-5.331v5.331m7.548-5.331v5.331m7.548-5.331v5.331m7.548-5.331v5.331M36.244 67.7v5.33m7.548-5.329v5.33m7.548-5.33v5.33m7.548-5.33v5.33m7.548-5.33v5.33m7.548-5.33v5.33M34.922 18.25c4.59-5.102 11.2-8.302 18.546-8.302 13.864 0 25.103 11.397 25.103 25.456A25.6 25.6 0 0 1 74 50.054m-42.37-27.21a25.6 25.6 0 0 0-3.264 12.56c0 14.059 11.238 25.456 25.102 25.456 3.224 0 6.306-.617 9.137-1.74m4.833-2.563a25 25 0 0 0 3.051-2.443"/><circle cx="74" cy="22.843" r="8.531" fill="#fff" stroke="#fff" strokeWidth="3.938"/><circle cx="74" cy="22.843" r="10.5" stroke="#333" strokeWidth="1.969"/><path stroke="#333" strokeWidth="1.969" d="M74 17.128v10.5m0 0-3.937-3.818M74 27.628l3.938-3.818"/></g><defs><clipPath id="low_a"><path fill="#fff" d="M.5.5h105v105H.5z"/></clipPath></defs></svg>
  );
}

// 4. Medios de pago: Tarjetas de crédito en abanico con banda magnética, chip y billetera
function PaymentsIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 105 105" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[90px] md:h-[90px]"><circle cx="53" cy="53" r="45.54" fill="#eee"/><rect width="38.396" height="47.058" x="59.981" y="9.031" fill="#fff" stroke="#333" strokeWidth="1.969" rx="3.938" transform="rotate(64.16 59.981 9.031)"/><rect width="38.396" height="47.058" x="70.246" y="12.231" fill="#fff" stroke="#333" strokeWidth="1.969" rx="3.938" transform="rotate(64.16 70.246 12.231)"/><path fill="#ffe600" stroke="#fff" strokeWidth="3.938" d="M16.25 88.858V34.316h62.208a7.93 7.93 0 0 1 7.928 7.928V80.93a7.93 7.93 0 0 1-7.928 7.927z"/><path stroke="#333" strokeWidth="1.969" d="M78.458 90.826H16.081a1.8 1.8 0 0 1-1.8-1.8V47.095m0-5.25v-7.697a1.8 1.8 0 0 1 1.8-1.8h62.377c5.466 0 9.896 4.431 9.896 9.897V80.93q0 .478-.044.945m-1.841 4.867a10 10 0 0 1-2.625 2.492"/><path fill="#fff" stroke="#fff" strokeWidth="3.938" d="M50.463 54.463h39.954v15.412H50.463a7.706 7.706 0 1 1 0-15.412Z"/><path stroke="#333" strokeWidth="1.969" d="M40.789 62.17a9.673 9.673 0 0 1 9.674-9.675h41.922v19.349H50.463c-5.343 0-9.675-4.332-9.675-9.675Z"/><circle cx="51.318" cy="62.169" r="2.487" fill="#333"/></svg>
  );
}

// 5. Compra protegida / segura: Certificado de garantía con lazos de seguridad y sello con tilde
function SecureShoppingIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 105 105" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[90px] md:h-[90px]"><circle cx="53" cy="53" r="45.54" fill="#eee"/><path fill="#fff" fillRule="evenodd" d="M15.338 81.79a1.313 1.313 0 0 1-1.312-1.312v-54.82c0-.724.587-1.312 1.312-1.312h73.967c.724 0 1.312.588 1.312 1.313v54.819c0 .725-.588 1.312-1.312 1.312z" clipRule="evenodd"/><mask id="buy_a" fill="#fff"><path fillRule="evenodd" d="M64.452 49.418V24.246h-24.32v25.172l6.156-5.965 5.946 5.965 6.258-5.965zm-42.95 22.201h16.245V61.197H21.502z" clipRule="evenodd"/></mask><path fill="#ffe600" fillRule="evenodd" d="M64.452 49.418V24.246h-24.32v25.172l6.156-5.965 5.946 5.965 6.258-5.965zm-42.95 22.201h16.245V61.197H21.502z" clipRule="evenodd"/><path fill="#fff" d="M64.452 24.246h3.937v-3.938h-3.937zm0 25.172L61.666 52.2l6.723 6.73v-9.513zm-24.32-25.172v-3.938h-3.938v3.938zm0 25.172h-3.938v9.298l6.678-6.47zm6.156-5.965 2.789-2.78-2.74-2.75-2.789 2.702zm5.946 5.965-2.79 2.78 2.719 2.727 2.787-2.657zm6.258-5.965 2.786-2.783-2.718-2.72-2.784 2.652zM37.748 71.619v3.938h3.937v-3.938zm-16.245 0h-3.937v3.938h3.937zm16.245-10.422h3.937v-3.938h-3.937zm-16.245 0v-3.938h-3.937v3.938zm39.012-36.951v25.172h7.875V24.246zm-20.382 3.937h24.32v-7.875h-24.32zm3.937 4.241v-8.178h-7.875v8.178zm0 16.994V32.424h-7.875v16.994zm-.52-8.793-6.157 5.965 5.48 5.656 6.156-5.965zm11.473 6.013-5.945-5.965-5.578 5.56 5.946 5.965zm.754-6.035-6.259 5.965 5.433 5.7 6.259-5.965zm11.461 6.032-5.959-5.965-5.571 5.566 5.96 5.965zm-29.49 21.047H21.502v7.875h16.245zm-3.938-6.485v10.422h7.875V61.197zm-12.307 3.937h16.245V57.26H21.502zm3.938 6.485V61.197h-7.875v10.422z" mask="url(#buy_a)"/><path stroke="#333" strokeWidth="1.969" d="M37.747 71.62H21.502V61.197h16.245z"/><path fill="#eee" d="M14.025 76.232h76.582v5.529H14.025z"/><path stroke="#333" strokeWidth="1.969" d="M64.452 24.246v25.172l-5.96-5.965-6.258 5.965-5.946-5.965-6.156 5.965V24.246z" clipRule="evenodd"/><path stroke="#333" strokeWidth="1.969" d="M14.026 45.125v35.353c0 .725.587 1.312 1.312 1.312h73.967c.724 0 1.312-.588 1.312-1.312v-7.79M14.025 39.875V25.659c0-.725.588-1.313 1.313-1.313h73.967c.724 0 1.312.588 1.312 1.313V58.25m0 5.25v3.938"/><circle cx="90.607" cy="24.246" r="8.531" fill="#fff" stroke="#fff" strokeWidth="3.938"/><circle cx="90.607" cy="24.246" r="10.5" stroke="#333" strokeWidth="1.969"/><path stroke="#333" strokeWidth="1.969" d="m86.114 24.433 2.882 3 6.125-6.375"/></svg>
  );
}

// 6. En oferta: Caja de regalo con moño y lazo, etiqueta de descuento con % y destellos de rebaja
function OffersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 105 105" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[90px] md:h-[90px]">
  <circle cx="53" cy="53" r="45.54" fill="#eee" />
  
  {/* Caja de regalo / Shopping bag en el fondo */}
  {/* Caja base en blanco */}
  <rect x="22" y="44" width="46" height="42" rx="3" fill="#fff" stroke="#333" strokeWidth="1.969" />
  
  {/* Tapa de la caja */}
  <rect x="18" y="36" width="54" height="10" rx="2" fill="#fff" stroke="#333" strokeWidth="1.969" />
  
  {/* Cinta vertical de la caja en amarillo #ffe600 */}
  <rect x="40" y="44" width="10" height="42" fill="#ffe600" stroke="#333" strokeWidth="1.969" />
  <rect x="40" y="36" width="10" height="10" fill="#ffe600" stroke="#333" strokeWidth="1.969" />
  
  {/* Moño superior */}
  <path d="M45 36 C41 28 32 28 34 33 C36 37 42 36 45 36 Z" fill="#ffe600" stroke="#333" strokeWidth="1.969" />
  <path d="M45 36 C49 28 58 28 56 33 C54 37 48 36 45 36 Z" fill="#ffe600" stroke="#333" strokeWidth="1.969" />
  <circle cx="45" cy="36" r="3" fill="#fff" stroke="#333" strokeWidth="1.969" />

  {/* Etiqueta de descuento colgante en primer plano a la derecha */}
  {/* Sombra / borde blanco grueso */}
  <g transform="rotate(16 66 52)">
    <path d="M50 26 L76 26 L92 42 L66 68 L50 52 Z" fill="#fff" stroke="#fff" strokeWidth="5.25" strokeLinejoin="round" />
    <path d="M50 26 L76 26 L92 42 L66 68 L50 52 Z" fill="#ffe600" stroke="#333" strokeWidth="1.969" strokeLinejoin="round" />
    <circle cx="58" cy="34" r="3" fill="#fff" stroke="#333" strokeWidth="1.969" />
    
    {/* Símbolo de porcentaje % estilizado */}
    <circle cx="67" cy="44" r="3.2" fill="#fff" stroke="#333" strokeWidth="1.8" />
    <path d="M78 40 L64 54" stroke="#333" strokeWidth="1.969" strokeLinecap="round" />
    <circle cx="75" cy="50" r="3.2" fill="#fff" stroke="#333" strokeWidth="1.8" />
  </g>
  
  {/* Hilo de la etiqueta al moño */}
  <path d="M48 36 C55 33 60 28 62 31" stroke="#333" strokeWidth="1.969" strokeLinecap="round" strokeDasharray="3 3" />

  {/* Chispas / destellos de oferta */}
  <path d="M83 22 L84.5 16 L86 22 L92 23.5 L86 25 L84.5 31 L83 25 L77 23.5 Z" fill="#ffe600" stroke="#333" strokeWidth="1.3" />
  <path d="M16 30 L17 26 L18 30 L22 31 L18 32 L17 36 L16 32 L12 31 Z" fill="#ffe600" stroke="#333" strokeWidth="1.3" />
</svg>
  );
}

// Mapa de ilustraciones por tipo
function CardIllustration({ iconType, imageUrl, title }: { iconType?: string | null; imageUrl?: string | null; title: string }) {
  if (imageUrl && imageUrl.trim() !== "" && imageUrl !== "null") {
    return (
      <div className="h-20 w-20 sm:h-22 sm:w-22 md:h-[90px] md:w-[90px] flex items-center justify-center overflow-hidden rounded-xl">
        <img src={imageUrl} alt={title} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  switch (iconType) {
    case 'login':
      return <LoginIllustration />;
    case 'bestsellers':
      return <BestsellersIllustration />;
    case 'under_30k':
      return <Under30kIllustration />;
    case 'payments':
      return <PaymentsIllustration />;
    case 'secure_shopping':
      return <SecureShoppingIllustration />;
    case 'offers':
      return <OffersIllustration />;
    default:
      return <LoginIllustration />;
  }
}

// ==============================================================================
// COMPONENTE PRINCIPAL: CARRUSEL DE TARJETAS DE ACCESO RÁPIDO
// ==============================================================================
interface QuickCardsCarouselProps {
  cards?: QuickAccessCard[];
}

export default function QuickCardsCarousel({ cards }: QuickCardsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Tarjetas por defecto si no vienen cargadas desde la BD
  const defaultCards: QuickAccessCard[] = [
    {
      id: 1,
      title: "Ingresá a tu cuenta",
      subtitle: "",
      icon_type: "login",
      button_text: "Ingresá a tu cuenta",
      link_url: "/auth?mode=login",
      orden: 0,
      is_active: true
    },
    {
      id: 2,
      title: "Más vendidos",
      subtitle: "",
      icon_type: "bestsellers",
      button_text: "Ver más",
      link_url: "/catalog?sort=popular",
      orden: 1,
      is_active: true
    },
    {
      id: 3,
      title: "Menos de $30.000",
      subtitle: "",
      icon_type: "under_30k",
      button_text: "Ver productos",
      link_url: "/catalog?max_price=30000",
      orden: 2,
      is_active: true
    },
    {
      id: 4,
      title: "Medios de pago",
      subtitle: "",
      icon_type: "payments",
      button_text: "Ver medios",
      link_url: "#medios-de-pago",
      orden: 3,
      is_active: true
    },
    {
      id: 5,
      title: "Compra protegida",
      subtitle: "",
      icon_type: "secure_shopping",
      button_text: "Cómo funciona",
      link_url: "#compra-protegida",
      orden: 4,
      is_active: true
    },
    {
      id: 6,
      title: "En oferta",
      subtitle: "",
      icon_type: "offers",
      button_text: "Ver ofertas",
      link_url: "/catalog?on_sale=true",
      orden: 5,
      is_active: true
    }
  ];

  const displayCards = cards && cards.length > 0 ? cards : defaultCards;

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [displayCards]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = 300;
    const target = direction === 'left' ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handleCardClick = (e: React.MouseEvent, card: QuickAccessCard) => {
    if (card.link_url === '#compra-protegida') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('abrir-modal-footer', { detail: 'compra_protegida' }));
    } else if (card.link_url === '#medios-de-pago') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('abrir-modal-footer', { detail: 'preguntas' }));
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20 -mt-16 sm:-mt-20 md:-mt-28 lg:-mt-32 mb-8 animate-slide-up group/quickcards">
      {/* Botón Flecha Izquierda */}
      {canScrollLeft && (
        <button 
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Ver tarjetas anteriores"
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 sm:-ml-5 z-30 p-2.5 rounded-full bg-[#FAF8F5] shadow-md border border-[#EAE5DC] text-[#5C4A3A] hover:bg-white active:scale-95 transition opacity-0 group-hover/quickcards:opacity-100 cursor-pointer hidden md:flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Contenedor Deslizable de Tarjetas */}
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scrollbar-none py-3 px-1 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayCards.map((card) => (
          <Link
            key={card.id}
            href={card.link_url}
            onClick={(e) => handleCardClick(e, card)}
            className="w-[144px] sm:w-[158px] md:w-[174px] aspect-[4/5] flex-shrink-0 snap-start bg-[#FAF8F5] border border-[#EAE5DC] hover:border-[#B88D65]/50 rounded-[22px] p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(78,66,52,0.06)] hover:shadow-[0_8px_24px_rgba(78,66,52,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-center text-center group/card cursor-pointer select-none"
          >
            {/* 1. Dibujo / Ilustración Vectorial Ampliada */}
            <div className="flex-1 w-full flex items-center justify-center transition-transform duration-300 group-hover/card:scale-105">
              <CardIllustration 
                iconType={card.icon_type} 
                imageUrl={card.image_url} 
                title={card.title} 
              />
            </div>

            {/* 2. Título de la Tarjeta */}
            <div className="my-1.5 flex items-center justify-center w-full min-h-[26px]">
              <h3 className="text-xs sm:text-[13px] font-semibold text-[#2C2723] group-hover/card:text-[#A97950] transition-colors leading-snug tracking-tight text-center line-clamp-1">
                {card.title}
              </h3>
            </div>

            {/* 3. Botón Píldora */}
            <div className="w-full py-1.5 sm:py-2 px-2 rounded-full bg-[#B88D65] group-hover/card:bg-[#A37953] text-white text-[10px] sm:text-[11px] font-medium text-center transition-colors shadow-2xs">
              <span className="truncate block">{card.button_text || "Ver más"}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Botón Flecha Derecha */}
      {canScrollRight && (
        <button 
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Ver más tarjetas"
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 sm:-mr-5 z-30 p-2.5 rounded-full bg-[#FAF8F5] shadow-md border border-[#EAE5DC] text-[#5C4A3A] hover:bg-white active:scale-95 transition opacity-0 group-hover/quickcards:opacity-100 cursor-pointer hidden md:flex items-center justify-center"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
