import i18n from '@/lib/i18n'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RxGlobe } from 'react-icons/rx'

export const Route = createFileRoute('/portfolio')({
  component: RouteComponent,
})

const contacts: { title: string; previewTitle: string; link?: string }[] = [
  { title: 'email', previewTitle: 'mikis.explores@gmail.com', link: 'mailto:mikis.explores@gmail.com' },
  { title: 'github', previewTitle: 'PoweredDeveloper', link: 'https://github.com/PoweredDeveloper' },
  { title: 'instagram', previewTitle: 'ist.mik', link: 'https://www.instagram.com/ist.mik' },
  { title: 'telegram', previewTitle: 'InsertB', link: 'https://t.me/InsertB' },
]

function RouteComponent() {
  const { t } = useTranslation('portfolio')

  return (
    <div className="selection:font-neutral selection:bg-select-background selection:text-select-foreground font-ibm-mono flex justify-center p-8 text-sm font-light">
      <div className="max-w-[650px]">
        <header className="mb-12 grid min-h-24 grid-cols-2 gap-2 md:my-24 md:grid-cols-[250px_200px_1fr] md:gap-12">
          <div className="col-span-2 flex h-full flex-row items-start justify-between md:col-span-1 md:flex-col">
            <div>
              <h1>{t('header.name')}</h1>
              <p className="text-pale">{t('header.profession')}</p>
            </div>
            <Link to="/" className="flex w-min items-center gap-1 text-nowrap select-none hover:underline">
              <RxGlobe className="size-3.5" />
              {t('header.website')}
            </Link>
          </div>
          <div className="flex h-full flex-col justify-between">
            <span className="select-none">*</span>
            <span>{t('header.location')}</span>
          </div>
          <div className="flex h-full flex-col items-end justify-between gap-3 text-nowrap select-none md:gap-0">
            <span className="hover:cursor-pointer hover:underline" onClick={() => i18n.changeLanguage('en')}>
              [ENG]
            </span>
            <span className="hover:cursor-pointer hover:underline" onClick={() => i18n.changeLanguage('ru')}>
              [РУС]
            </span>
            <span className="hover:cursor-pointer hover:underline" onClick={() => i18n.changeLanguage('ja')}>
              [日本語]
            </span>
          </div>
        </header>
        <main className="space-y-6 md:space-y-16">
          <section className="grid grid-cols-1 gap-2 md:grid-cols-[200px_1fr]">
            <h2>{t('about.title')}</h2>
            <p>{t('about.text')}</p>
          </section>
          <section className="grid grid-cols-1 gap-2 md:grid-cols-[200px_1fr]">
            <h2>{t('skills.title')}</h2>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <h3>{t('skills.frontend_title')}</h3>
                <p className="text-pale">React, TypeScript, Next.js, Vite, Tailwind CSS, TanStack Query, React Icons</p>
              </div>
              <div className="flex flex-col gap-2">
                <h3>{t('skills.backend_title')}</h3>
                <p className="text-pale">FastAPI, Python, PostgreSQL, SQLAlchemy, Express.js, Node.js, Uvicorn, Pydantic, Docker, Alembic</p>
              </div>
              <div className="flex flex-col gap-2">
                <h3>{t('skills.tools_title')}</h3>
                <p className="text-pale">Docker, Git, TypeScript, Prettier, Vite, Husky, OpenAPI, PNPM</p>
              </div>
            </div>
          </section>
          <section className="grid grid-cols-1 gap-2 md:grid-cols-[200px_1fr]">
            <h2>{t('contacts.title')}</h2>
            <div className="space-y-3">
              {contacts.map((c, index) => (
                <div className="flex gap-1" key={index}>
                  <h5 className="text-pale">{c.title}:</h5>
                  <Link to={c.link} className="hover:cursor-pointer hover:underline">
                    {c.previewTitle.toLowerCase()}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
