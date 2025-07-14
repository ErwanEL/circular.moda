import { FaWhatsapp } from 'react-icons/fa6';

export default function WhatsappFloat() {
  return (
    <a
      href="https://wa.me/?text=¡Mirá%20esto%20en%20circular.moda!"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed z-50 bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-colors duration-200"
    >
      <FaWhatsapp className="w-7 h-7" />
    </a>
  );
} 