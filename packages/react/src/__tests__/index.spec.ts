import render from '../index'
import { beforeEach, describe, expect, test } from "vitest";
import { Window } from 'happy-dom';

const window = new Window();
const document = window.document;

describe('Dom测试', () => {
    beforeEach(() => {
        const window = new Window();
        const document = window.document;
    })
    
    test('测试dom操作', () => {
        render(document)
        expect(document.getElementsByClassName('c1').length).toBe(1)
        expect(document.getElementsByClassName('c1')[0].innerHTML).toBe("🚗 Hello Vite")
    })
})