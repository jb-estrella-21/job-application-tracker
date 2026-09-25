import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('./AuthContext', () => ({ useAuth }));

function renderRoute(status: string) {
  useAuth.mockReturnValue({ status });
  render(<MemoryRouter initialEntries={['/protected']}><Routes><Route element={<ProtectedRoute />}><Route path="/protected" element={<p>Protected content</p>} /></Route><Route path="/login" element={<p>Login page</p>} /></Routes></MemoryRouter>);
}

describe('ProtectedRoute', () => {
  it('waits while authentication is checking', () => { renderRoute('checking'); expect(screen.getByText(/checking your session/i)).toBeInTheDocument(); expect(screen.queryByText('Protected content')).not.toBeInTheDocument(); });
  it('renders protected content when authenticated', () => { renderRoute('authenticated'); expect(screen.getByText('Protected content')).toBeInTheDocument(); });
  it('redirects after authentication is confirmed absent', () => { renderRoute('unauthenticated'); expect(screen.getByText('Login page')).toBeInTheDocument(); });
});
