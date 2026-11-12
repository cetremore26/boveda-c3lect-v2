import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api/orders', () => ({ ordersApi: { crear: vi.fn() } }));
vi.mock('../api/payments', () => ({ paymentsApi: { crearPendiente: vi.fn() } }));
vi.mock('./metaPixel', () => ({
  trackInitiateCheckout: vi.fn(),
  trackPurchase: vi.fn(),
  setMetaUserData: vi.fn(),
  getFbCookies: vi.fn(() => ({ fbp: 'fb.1', fbc: 'fc.1' })),
}));

import {
  submitCheckout,
  esUrlDeMercadoPago,
  CheckoutUrlInvalidaError,
  type ShippingForm,
} from './checkout';
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

const MP_URL = 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('esUrlDeMercadoPago', () => {
  it.each([
    'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=1',
    'https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=1',
    'https://www.mercadopago.com/checkout/v1/redirect?pref_id=1',
    'https://WWW.MERCADOPAGO.COM.CO/x',
  ])('acepta %s', (u) => expect(esUrlDeMercadoPago(u)).toBe(true));

  it.each([
    '',
    'no es url',
    'http://www.mercadopago.com.co/x',
    'https://mercadopago.com.co.evil.com/x',
    'https://evilmercadopago.com/x',
    'javascript:alert(1)',
    'https://user@evil.com/?x=mercadopago.com',
  ])('rechaza %j', (u) => expect(esUrlDeMercadoPago(u)).toBe(false));
});

describe('submitCheckout CONTRAENTREGA', () => {
  it('crea el pedido, registra Purchase y no crea pago pendiente', async () => {
    const order = { id: 'o1', orderNumber: 'C3-001', subtotal: 260000, total: 260000 };
    vi.mocked(ordersApi.crear).mockResolvedValue(order);

    const r = await submitCheckout({
      items,
      totalPrice: 250000,
      metodoPago: 'CONTRAENTREGA',
      form,
      idempotencyKey: 'k-1',
    });

    expect(ordersApi.crear).toHaveBeenCalledWith({
      metodoPago: 'CONTRAENTREGA',
      items: itemsPayload,
      shippingInfo: form,
      fbp: 'fb.1',
      fbc: 'fc.1',
      idempotencyKey: 'k-1',
    });
    expect(r).toEqual({ kind: 'contraentrega', order });
    expect(trackPurchase).toHaveBeenCalledTimes(1);
    // El Purchase usa el total del backend, no el del carrito.
    expect(trackPurchase).toHaveBeenCalledWith({ orderNumber: 'C3-001', items, total: 260000 });
    expect(paymentsApi.crearPendiente).not.toHaveBeenCalled();
  });

  it('si el backend no devuelve total, el Purchase usa el total del carrito', async () => {
    vi.mocked(ordersApi.crear).mockResolvedValue({ id: 'o1', orderNumber: 'C3-001' } as never);
    await submitCheckout({ items, totalPrice: 250000, metodoPago: 'CONTRAENTREGA', form, idempotencyKey: 'k' });
    expect(trackPurchase).toHaveBeenCalledWith({ orderNumber: 'C3-001', items, total: 250000 });
  });

  it('si crear rechaza, rechaza y no registra Purchase', async () => {
    vi.mocked(ordersApi.crear).mockRejectedValue(new Error('boom'));
    await expect(
      submitCheckout({ items, totalPrice: 250000, metodoPago: 'CONTRAENTREGA', form, idempotencyKey: 'k' }),
    ).rejects.toThrow('boom');
    expect(trackPurchase).not.toHaveBeenCalled();
  });
});

describe('submitCheckout MERCADOPAGO', () => {
  it('crea pago pendiente y devuelve checkoutUrl sin Purchase ni pedido', async () => {
    vi.mocked(paymentsApi.crearPendiente).mockResolvedValue({ checkoutUrl: MP_URL });

    const r = await submitCheckout({ items, totalPrice: 250000, metodoPago: 'MERCADOPAGO', form, idempotencyKey: 'k' });

    expect(paymentsApi.crearPendiente).toHaveBeenCalledWith({
      items: itemsPayload,
      shippingInfo: form,
      fbp: 'fb.1',
      fbc: 'fc.1',
    });
    expect(r).toEqual({ kind: 'mercadopago', checkoutUrl: MP_URL });
    expect(trackPurchase).not.toHaveBeenCalled();
    expect(ordersApi.crear).not.toHaveBeenCalled();
    expect(vi.mocked(paymentsApi.crearPendiente).mock.calls[0][0]).not.toHaveProperty('idempotencyKey');
  });

  it.each(['', 'https://evil.com/x'])('checkoutUrl %j lanza CheckoutUrlInvalidaError', async (checkoutUrl) => {
    vi.mocked(paymentsApi.crearPendiente).mockResolvedValue({ checkoutUrl });
    await expect(
      submitCheckout({ items, totalPrice: 1, metodoPago: 'MERCADOPAGO', form, idempotencyKey: 'k' }),
    ).rejects.toBeInstanceOf(CheckoutUrlInvalidaError);
  });
});

describe('submitCheckout tracking común', () => {
  beforeEach(() => {
    vi.mocked(paymentsApi.crearPendiente).mockResolvedValue({ checkoutUrl: MP_URL });
  });

  it('trackInitiateCheckout con items y total', async () => {
    await submitCheckout({ items, totalPrice: 250000, metodoPago: 'MERCADOPAGO', form, idempotencyKey: 'k' });
    expect(trackInitiateCheckout).toHaveBeenCalledWith(items, 250000);
  });

  it('separa firstName y lastName', async () => {
    await submitCheckout({ items, totalPrice: 1, metodoPago: 'MERCADOPAGO', form, idempotencyKey: 'k' });
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
      idempotencyKey: 'k',
    });
    expect(setMetaUserData).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ana', lastName: undefined }),
    );
  });
});
