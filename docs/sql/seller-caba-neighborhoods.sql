-- Apply after seller-storefront.sql. CABA-only launch area.
begin;
set local lock_timeout = '5s';
alter table public.users add column if not exists neighborhood text not null default '';
-- Preserve an exact neighborhood previously entered in the free-text city field.
update public.users set neighborhood = city where neighborhood = '' and city in ('Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito', 'Chacarita', 'Coghlan', 'Colegiales', 'Constitución', 'Flores', 'Floresta', 'La Boca', 'La Paternal', 'Liniers', 'Mataderos', 'Monserrat', 'Monte Castro', 'Nueva Pompeya', 'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco', 'Parque Chas', 'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro', 'Saavedra', 'San Cristóbal', 'San Nicolás', 'San Telmo', 'Vélez Sarsfield', 'Versalles', 'Villa Crespo', 'Villa del Parque', 'Villa Devoto', 'Villa General Mitre', 'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón', 'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati', 'Villa Urquiza');
update public.users set city = 'Buenos Aires (CABA)' where city is distinct from 'Buenos Aires (CABA)';
alter table public.users alter column city set default 'Buenos Aires (CABA)';
alter table public.users drop constraint if exists users_city_caba;
alter table public.users add constraint users_city_caba check (city = 'Buenos Aires (CABA)');
alter table public.users drop constraint if exists users_neighborhood_caba;
alter table public.users add constraint users_neighborhood_caba check (neighborhood = '' or neighborhood in ('Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito', 'Chacarita', 'Coghlan', 'Colegiales', 'Constitución', 'Flores', 'Floresta', 'La Boca', 'La Paternal', 'Liniers', 'Mataderos', 'Monserrat', 'Monte Castro', 'Nueva Pompeya', 'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco', 'Parque Chas', 'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro', 'Saavedra', 'San Cristóbal', 'San Nicolás', 'San Telmo', 'Vélez Sarsfield', 'Versalles', 'Villa Crespo', 'Villa del Parque', 'Villa Devoto', 'Villa General Mitre', 'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón', 'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati', 'Villa Urquiza'));
notify pgrst, 'reload schema';
commit;
