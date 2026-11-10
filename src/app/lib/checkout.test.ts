import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api/orders', () => ({ ordersApi: { crear: vi.fn() } }));
vi.mock('../api/payments', () => ({ paymentsApi: { crearPendiente: vi.fn() } }));
vi.mock('./metaPixel', () => ({
  trackInitiateCheckout: vi.fn(),
  trackPurchase: vi.fn(),
  setMetaUserData: vi.fn(),
  getFbCookies: vi.fn(() => ({ fbp: 'fb.1', fbc: 'fc.1' })),
}));

import { submitCheckout, type ShippingForm } from './checkout';
import { ordersApi } from '../api/orders';
import { paymentsApi } from '../api/payments';
import { trackInitiateCheckout, trackPurchase, setMetaUserData } from './metaPixel';
import type { CartItem } from '../context/CartContext';

const items = [
  { producto: { id: 'p1' }, cantidad: 2 },
  { producto: { id: 'p2' }, cantidad: 1 },
] as unknown as CartItem[];

const form: ShippingForm = {
  nombreCompleto: 'Ana María Pérez',
  email: 'ana@example.com',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  direccion: 'Calle 1 # 2-3',
  notas: '',
};

const itemsPayload = [
  { productId: 'p1', cantidad: 2 },
  { productId: 'p2', cantidad: 1 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('submitCheckout CONTRAENTREGA', () => {
  it('crea el pedido, registra Purchase y no crea pago pendiente', async () => {
    const order = { id: 'o1', orderNumber: 'C3-001' };
    vi.mocked(ordersApi.crear).mockResolvedValue(order as never);

    const r = await submitCheckout({ items, totalPrice: 250000, metodoPago: 'CONTRAENTREGA', form });

    expect(ordersApi.crear).toHaveBeenCalledWith({
      metodoPago: 'CONTRAENTREGA',
      items: itemsPayload,
      shippingInfo: form,
      fbp: 'fb.1',
      fbc: 'fc.1',
    });
    expect(r).toEqual({ kind: 'contraentrega', order });
    expect(trackPurchase).toHaveBeenCalledTimes(1);
    expect(trackPurchase).toHaveBeenCalledWith({ orderNumber: 'C3-001', items, total: 250000 });
    expect(paymentsApi.crearPendiente).not.toHaveBeenCalled();
  });

  it('si crear rechaza, rechaza y no registra Purchase', async () => {
    vi.mocked(ordersApi.crear).mockRejectedValue(new Error('boom'));
    await expect(
      submitCheckout({ items, totalPrice: 250000, metodoPago: 'CONTRAENTREGA', form }),
    ).rejects.toThrow('boom');
    expect(trackPurchase).not.toHaveBeenCalled();
  });
});

describe('submitCheckout MERCADOPAGO', () => {
  it('crea pago pendiente y devuelve checkoutUrl sin Purchase ni pedido', async () => {
    vi.mocked(paymentsApi.crearPendiente).mockResolvedValue({ checkoutUrl: 'https://mp/x' } as never);

    const r = await submitCheckout({ items, totalPrice: 250000, metodoPago: 'MERCADOPAGO', form });

    expect(paymentsApi.crearPendiente).toHaveBeenCalledWith({
      items: itemsPayload,
      shippingInfo: form,
      fbp: 'fb.1',
      fbc: 'fc.1',
    });
    expect(r).toEqual({ kind: 'mercadopago', checkoutUrl: 'https://mp/x' });
    expect(trackPurchase).not.toHaveBeenCalled();
    expect(ordersApi.crear).not.toHaveBeenCalled();
  });
});

describe('submitCheckout tracking común', () => {
  beforeEach(() => {
    vi.mocked(paymentsApi.crearPendiente).mockResolvedValue({ checkoutUrl: 'u' } as never);
  });

  it('trackInitiateCheckout con items y total', async () => {
    await submitCheckout({ items, totalPrice: 250000, metodoPago: 'MERCADOPAGO', form });
    expect(trackInitiateCheckout).toHaveBeenCalledWith(items, 250000);
  });

  it('separa firstName y lastName', async () => {
    await submitCheckout({ items, totalPrice: 1, metodoPago: 'MERCADOPAGO', form });
    expect(setMetaUserData).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ana', lastName: 'María Pérez' }),
    );
  });

  it('lastName undefined con un solo nombre', async () => {
    await submitCheckout({
      items,
      totalPrice: 1,
      metodoPago: 'MERCADOPAGO',
      form: { ...form, nombreCompleto: 'Ana' },
    });
    expect(setMetaUserData).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ana', lastName: undefined }),
    );
  });
});
