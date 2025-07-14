import { FaWhatsapp } from 'react-icons/fa6';

export default function WhatsappFloat() {
  return (
    <a
      href="https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed right-6 bottom-6 z-50 flex items-center justify-center rounded-full bg-green-500 p-4 text-white shadow-lg transition-colors duration-200 hover:bg-green-600"
    >
      <FaWhatsapp className="h-7 w-7" />
    </a>
  );
}
