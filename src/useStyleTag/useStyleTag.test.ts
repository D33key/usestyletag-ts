import { renderHook, act } from '@testing-library/react-hooks';
import useStyleTag from './useStyleTag';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('useStyleTag', () => {
	let mockDocument: Document;

	beforeEach(() => {
		// Создаем mock-документ с head
		mockDocument = {
			head: document.createElement('head'),
			createElement: document.createElement.bind(document),
			getElementById: document.getElementById.bind(document),
		} as unknown as Document;
	});

	it('должен добавить стиль при инициализации, если immediate = true', () => {
		const { result } = renderHook(() =>
			useStyleTag('.test { color: red; }', { document: mockDocument }),
		);

		// Проверяем, что стиль добавлен
		expect(mockDocument.head.querySelector('style')).not.toBeNull();
		expect(mockDocument.head.querySelector('style')?.textContent).toBe(
			'.test { color: red; }',
		);
		expect(result.current.isLoaded).toBe(true);
	});

	it('должен не добавлять стиль при manual = true', () => {
		const { result } = renderHook(() =>
			useStyleTag('.test { color: red; }', {
				document: mockDocument,
				manual: true,
			}),
		);

		// Проверяем, что стиль не добавлен
		expect(mockDocument.head.querySelector('style')).toBeNull();
		expect(result.current.isLoaded).toBe(false);

		// Загружаем вручную
		act(() => {
			result.current.load();
		});

		expect(mockDocument.head.querySelector('style')).not.toBeNull();
		expect(result.current.isLoaded).toBe(true);
	});

	it('должен обновлять CSS при вызове updateCss', () => {
		const { result } = renderHook(() =>
			useStyleTag('.test { color: red; }', { document: mockDocument }),
		);

		act(() => {
			result.current.updateCss('.test { color: blue; }');
		});

		// Проверяем, что CSS обновился
		expect(mockDocument.head.querySelector('style')?.textContent).toBe(
			'.test { color: blue; }',
		);
	});

	it('должен удалять стиль при вызове unload', () => {
		const { result } = renderHook(() =>
			useStyleTag('.test { color: red; }', { document: mockDocument }),
		);

		act(() => {
			result.current.unload();
		});

		// Проверяем, что стиль удален
		expect(mockDocument.head.querySelector('style')).toBeNull();
		expect(result.current.isLoaded).toBe(false);
	});

	it('должен использовать переданный id', () => {
		const customId = 'custom-style-id';
		const { result } = renderHook(() =>
			useStyleTag('.test { color: red; }', {
				document: mockDocument,
				id: customId,
			}),
		);

		// Проверяем, что стиль имеет указанный ID
		expect(mockDocument.head.querySelector(`#${customId}`)).not.toBeNull();
		expect(result.current.id).toBe(customId);
	});

	it('должен вызывать обработчики onLoad и onUnLoad', () => {
		const onLoad = vi.fn();
		const onUnLoad = vi.fn();

		const { result } = renderHook(() =>
			useStyleTag('.test { color: red; }', {
				document: mockDocument,
				onLoad,
				onUnLoad,
			}),
		);

		expect(onLoad).toHaveBeenCalledTimes(1);
		expect(onUnLoad).not.toHaveBeenCalled();

		act(() => {
			result.current.unload();
		});

		expect(onUnLoad).toHaveBeenCalledTimes(1);
	});

	it('должен безопасно завершать выполнение, если document.head отсутствует', () => {
		const brokenDocument = {
			...mockDocument,
			head: null,
		} as unknown as Document;

		const { result } = renderHook(() =>
			useStyleTag('.test { color: red; }', { document: brokenDocument }),
		);

		// Проверяем, что стиль не добавлен и ошибки не возникло
		expect(result.current.isLoaded).toBe(false);
		expect(() => result.current.load()).not.toThrow();
		expect(result.current.isLoaded).toBe(false);
	});
});
