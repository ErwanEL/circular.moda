'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number | string;
  name: string;
  phone?: string;
}

interface UserSelectorProps {
  value: string;
  onChange: (userId: string) => void;
  required?: boolean;
}

export default function UserSelector({
  value,
  onChange,
  required = true,
}: UserSelectorProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Charger les utilisateurs
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
    }
    setCreateError(null);
    
    console.log('[UserSelector] Tentative de création d\'utilisateur');
    console.log('[UserSelector] Nom:', newUserName.trim());
    console.log('[UserSelector] Téléphone:', newUserPhone.trim());
    
    if (!newUserName.trim() || !newUserPhone.trim()) {
      setCreateError('Veuillez remplir tous les champs');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: newUserName.trim(),
        phone: newUserPhone.trim(),
      };
      console.log('[UserSelector] Envoi de la requête avec payload:', payload);
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[UserSelector] Réponse reçue, status:', response.status);
      const data = await response.json();
      console.log('[UserSelector] Données reçues:', data);

      if (response.ok) {
        // Ajouter le nouvel utilisateur à la liste
        if (data.user) {
          console.log('[UserSelector] Utilisateur créé/sélectionné:', data.user);
          setUsers([...users, data.user]);
          onChange(String(data.user.id));
          setMode('select');
          setNewUserName('');
          setNewUserPhone('');
          setCreateError(null);
        } else {
          console.error('[UserSelector] Pas de user dans la réponse:', data);
          setCreateError('Réponse invalide du serveur');
        }
      } else {
        console.error('[UserSelector] Erreur de réponse:', data);
        // Si l'utilisateur existe déjà, l'utiliser
        if (data.user) {
          console.log('[UserSelector] Utilisateur existant utilisé:', data.user);
          setUsers([...users, data.user]);
          onChange(String(data.user.id));
          setMode('select');
          setNewUserName('');
          setNewUserPhone('');
          setCreateError(null);
        } else {
          setCreateError(data.error || 'Erreur lors de la création de l\'utilisateur');
          if (data.details) {
            console.error('[UserSelector] Détails de l\'erreur:', data.details);
          }
        }
      }
    } catch (error) {
      console.error('[UserSelector] Erreur de connexion:', error);
      setCreateError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Toggle entre sélection et création */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setMode('select')}
          className={`px-4 py-2 font-medium transition-colors ${
            mode === 'select'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Sélectionner un utilisateur
        </button>
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`px-4 py-2 font-medium transition-colors ${
            mode === 'create'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Créer un nouvel utilisateur
        </button>
      </div>

      {mode === 'select' ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Utilisateur {required && '*'}
          </label>
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Chargement des utilisateurs...
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
              />
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">-- Sélectionner un utilisateur --</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.phone && `(${user.phone})`}
                  </option>
                ))}
              </select>
              {filteredUsers.length === 0 && searchTerm && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucun utilisateur trouvé
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="newUserName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nom *
            </label>
            <input
              type="text"
              id="newUserName"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateUser(e as any);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: Juan Pérez"
            />
          </div>
          <div>
            <label
              htmlFor="newUserPhone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Téléphone *
            </label>
            <input
              type="tel"
              id="newUserPhone"
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateUser(e as any);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: +5491125115030"
            />
          </div>
          {createError && (
            <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm dark:bg-red-900/20 dark:text-red-400">
              {createError}
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCreateUser(e as any);
            }}
            disabled={creating || !newUserName.trim() || !newUserPhone.trim()}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? 'Création...' : 'Créer l\'utilisateur'}
          </button>
        </div>
      )}
    </div>
  );
}

