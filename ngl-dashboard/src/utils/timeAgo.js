/**
 * Convierte un timestamp ISO en formato de tiempo relativo legible en español.
 * Ej: "Hace unos segundos", "Hace 5 min", "Hace 2 h", "Ayer a las 18:30"
 */
export function timeAgo(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) {
    return 'Justo ahora';
  }
  if (diffInSeconds < 60) {
    return `Hace ${diffInSeconds} s`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `Ayer a las ${hours}:${minutes}`;
  }
  if (diffInDays < 7) {
    return `Hace ${diffInDays} días`;
  }

  // Formato de fecha completa para fechas más antiguas
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
