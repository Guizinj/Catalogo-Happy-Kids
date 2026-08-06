// js/auth.js

export function estaAutenticado() {
    return localStorage.getItem('usuario_logado') === 'true';
}

export function realizarLogin(email, senha) {
    if (email && senha) {
        localStorage.setItem('usuario_logado', 'true');
        return true;
    }
    return false;
}

export function realizarLogout() {
    localStorage.removeItem('usuario_logado');
}