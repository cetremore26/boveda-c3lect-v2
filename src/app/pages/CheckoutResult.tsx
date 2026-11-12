import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '../components/ds/Button';
import { useCart } from '../context/CartContext';
import { borrarPendingCheckout, leerPendingCheckout } from '../lib/checkoutPendiente';
import {
  efectoDelResultado,
  estadoDesdeRuta,
  numeroDePedidoVisible,
  TEXTOS_RESULTADO,
} from '../lib/resultadoCheckout';

const ICONOS = { success: CheckCircle2, failure: XCircle, pending: Clock };

export default function CheckoutResult() {
  const location = useLocation();
  const { clearCart } = useCart();
  const estado = estadoDesdeRuta(location.pathname);
  const orderNumber = numeroDePedidoVisible(estado, location.search);
  const { titulo, cuerpo, cta } = TEXTOS_RESULTADO[estado];
  const Icon = ICONOS[estado];

  useEffect(() => {
    const efecto = efectoDelResultado(estado, leerPendingCheckout(localStorage));
    if (efecto.vaciarCarrito) clearCart();
    if (efecto.borrarPendiente) borrarPendingCheckout(localStorage);
    // Solo al montar: el resultado depende de la ruta con la que se entra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0A0A0A]">
      <div className="w-full max-w-sm text-center">
        <Icon size={40} className="mx-auto mb-6" style={{ color: '#C9A84C' }} />
        <h1 className="text-3xl mb-4 text-white" style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}>
          {titulo}
        </h1>
        {orderNumber && (
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Pedido #{orderNumber}</p>
        )}
        <p className="text-white/60 text-sm leading-relaxed mb-10">{cuerpo}</p>
        <Button as={Link} to={cta.a} variant="block-dark">
          {cta.texto}
        </Button>
      </div>
    </div>
  );
}
