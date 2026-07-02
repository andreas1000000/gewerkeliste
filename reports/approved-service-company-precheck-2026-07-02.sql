with candidates(company_name, city, service_slug) as (
  values
  ('Inntaler Naturbau GmbH', 'Bad Endorf', 'hochbau'),
  ('Hoch- und Tiefbau Hans Obermair GmbH', 'Oberaudorf', 'hochbau'),
  ('Baugeschäft Maurer GmbH', 'Stephanskirchen-Ziegelberg', 'hochbau'),
  ('Dachdeckerei Otto Spenglerei', 'Bad Aibling', 'umbau'),
  ('Die Glaser', 'Bad Aibling', 'umbau'),
  ('Holzbau Glas', 'Bad Aibling', 'umbau'),
  ('Klepp Absauganlagen GmbH', 'Bad Aibling', 'umbau'),
  ('M. Schwendemann Bauunternehmung GmbH', 'Bad Aibling', 'umbau'),
  ('Metallbau - Bad Aibling', 'Bad Aibling', 'umbau'),
  ('Pakt Türen', 'Bad Aibling', 'umbau'),
  ('Schwaiger Bau', 'Bad Aibling', 'umbau'),
  ('Umbauhilfe Meyer', 'Bad Aibling', 'umbau'),
  ('werk.4 - Schreinerei Mathias Vierlinger', 'Bad Aibling', 'umbau'),
  ('Rudolf Hasholzner', 'Prien am Chiemsee', 'umbau'),
  ('Baumann KG – Rosenheim', 'Rosenheim', 'umbau'),
  ('bauwerk singer: Holzarchitektur & moderne', 'Rosenheim', 'umbau'),
  ('Architektur Krose / Hermann Krose', 'Kolbermoor', 'architektur'),
  ('Blaesig Architekten GmbH', 'Kolbermoor', 'architektur'),
  ('Moser Hoffmann Planungsgesellschaft UG', 'Kolbermoor', 'architektur'),
  ('WE&P GmbH', 'Kolbermoor', 'architektur'),
  ('HOOFF Architektur - Büro Prien', 'Prien am Chiemsee', 'architektur'),
  ('Josef Riefer Architektur', 'Prien am Chiemsee', 'architektur'),
  ('Püschel Architektengesellschaft mbH - Geschäftsstelle Prien', 'Prien am Chiemsee', 'architektur'),
  ('STANKO & Partner Architekten', 'Riedering', 'architektur'),
  ('Behringer Architekten', 'Rosenheim', 'architektur'),
  ('Finsterwalder Garten- und Landschaftsarchitektur', 'Rosenheim', 'architektur'),
  ('perner architekten & ingenieure', 'Rosenheim', 'architektur'),
  ('Dachdeckerei Otto Spenglerei', 'Bad Aibling', 'dachsanierung'),
  ('Meyer Bauabdichtung: Bau-Abdichtung Kuppeldach Bad Aibling I Dachabdichtung', 'Bad Aibling', 'dachsanierung'),
  ('Spenglerei Paul', 'Bad Aibling', 'dachsanierung'),
  ('Zimmerei Heiß + Heiß', 'Bad Aibling', 'dachsanierung'),
  ('Baumann KG – Rosenheim', 'Rosenheim', 'dachsanierung'),
  ('bauwerk singer: Holzarchitektur & moderne', 'Rosenheim', 'dachsanierung'),
  ('Dachdeckerei Paul Horner', 'Rosenheim', 'dachsanierung')
)
select c.company_name, c.city, c.service_slug, count(co.id) as production_matches
from candidates c
left join companies co on co.name = c.company_name and co.city = c.city and co.public_visible = true
group by c.company_name, c.city, c.service_slug
order by production_matches, c.company_name;
