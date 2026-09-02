-- Post-migration optionnel si product-interest-requests.sql a deja ete execute
-- avec availability_confirmed default true.
--
-- Ce script ne modifie pas les demandes existantes. Il change seulement la
-- valeur par defaut des prochaines insertions SQL directes.

alter table public.product_interest_requests
  alter column availability_confirmed set default false;
