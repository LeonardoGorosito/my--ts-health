import { Link } from 'react-router-dom'
import { LegalLayout, Fill } from '../../components/LegalLayout'
import type { LegalSection } from '../../components/LegalLayout'
import { LEGAL } from '../../lib/legal'
import { PLAN_INFO, PRICES, TRIAL_DAYS, formatPrice } from '../../lib/plans'

const contact = <Fill value={LEGAL.email} label="email de contacto" />
const link = (to: string, text: string) => <Link to={to}>{text}</Link>

const sections: LegalSection[] = [
  {
    id: 'aceptacion',
    title: 'Quién presta el servicio y aceptación',
    body: (
      <>
        <p>
          PetHealth es un servicio prestado por <Fill value={LEGAL.owner} label="nombre o razón social" />
          {LEGAL.taxId && <> (CUIT {LEGAL.taxId})</>}, con domicilio en {LEGAL.city} (en adelante, &quot;PetHealth&quot;, &quot;nosotros&quot;).
        </p>
        <p>
          Al crear una cuenta o usar el servicio aceptás estos Términos y Condiciones y la {link('/privacidad', 'Política de Privacidad')}. Si no estás de acuerdo, no uses el servicio.
        </p>
      </>
    ),
  },
  {
    id: 'servicio',
    title: 'Qué es PetHealth',
    body: (
      <p>
        PetHealth es una aplicación web para registrar la información de salud de tus mascotas (vacunas, desparasitaciones, historial médico y archivos) y generar una placa con código QR que muestra una página pública con sus datos y tu forma de contacto. Incluye un modo mascota perdida y, según el plan, recordatorios por email.
      </p>
    ),
  },
  {
    id: 'cuenta',
    title: 'Tu cuenta',
    body: (
      <ul>
        <li>Tenés que ser mayor de 18 años y darnos datos verdaderos.</li>
        <li>Cada cuenta es personal. Sos responsable de cuidar tu contraseña y de lo que se haga con tu cuenta.</li>
        <li>Si sospechás que alguien entró a tu cuenta, cambiá la contraseña y avisanos a {contact}.</li>
      </ul>
    ),
  },
  {
    id: 'planes',
    title: 'Prueba gratis y planes',
    body: (
      <>
        <p>
          Al registrarte tenés <strong>{TRIAL_DAYS} días de prueba gratis</strong> con todas las funciones del plan Pro, sin cargar ningún medio de pago. Al terminar la prueba podés contratar uno de estos planes mensuales:
        </p>
        <ul>
          {(['STANDARD', 'PRO'] as const).map((plan) => (
            <li key={plan}>
              <strong>{PLAN_INFO[plan].name}</strong>: {formatPrice(PRICES[plan].ARS, 'ARS')} o {formatPrice(PRICES[plan].USD, 'USD')} por mes. Incluye: {PLAN_INFO[plan].features.map((f) => f.charAt(0).toLowerCase() + f.slice(1)).join('; ')}.
            </li>
          ))}
        </ul>
        <p>
          Si la prueba o tu plan vencen y no contratás uno nuevo, tu cuenta pasa a <strong>modo de solo lectura</strong>: podés ver toda tu información, pero no agregar ni editar. <strong>La placa QR y el modo mascota perdida siguen funcionando siempre</strong>, tengas un plan activo o no.
        </p>
        <p>
          Podemos modificar los precios. Si lo hacemos, te vamos a avisar con al menos 30 días de anticipación, y el nuevo precio se aplica recién desde el período siguiente al aviso.
        </p>
      </>
    ),
  },
  {
    id: 'pagos',
    title: 'Pagos',
    body: (
      <>
        <p>
          Por ahora no hay pago online dentro de la aplicación. Para contratar un plan, escribinos a {contact}: acordamos el medio de pago y activamos el plan en tu cuenta por el período abonado.
        </p>
        <p>
          Cuando habilitemos el pago online, se va a hacer a través de un procesador de pagos externo y te vamos a informar sus condiciones antes de que pagues. Los precios en pesos incluyen los impuestos que correspondan.
        </p>
      </>
    ),
  },
  {
    id: 'arrepentimiento',
    title: 'Cancelación y derecho de arrepentimiento',
    body: (
      <>
        <p>
          Los planes no tienen permanencia mínima: podés dejar de pagar cuando quieras y tu cuenta pasa a modo de solo lectura al terminar el período abonado.
        </p>
        <p>
          <strong>Botón de arrepentimiento.</strong> Según el artículo 34 de la Ley 24.240 de Defensa del Consumidor, podés revocar la contratación dentro de los <strong>10 días corridos</strong> desde que contrataste un plan, sin dar motivos y sin costo. Para hacerlo, escribinos a {contact} con el asunto &quot;Arrepentimiento&quot; desde el email de tu cuenta. Dentro de las 24 horas te enviamos un código de identificación del trámite y te devolvemos el importe pagado por el mismo medio de pago.
        </p>
      </>
    ),
  },
  {
    id: 'placa',
    title: 'La placa QR y los datos públicos',
    body: (
      <>
        <p>
          La placa de cada mascota es pública: cualquier persona con el código QR o el link puede verla. Vos decidís qué datos de contacto se muestran, salvo tu nombre y tu email, que se muestran siempre. Mientras el modo mascota perdida está activo, también se muestra tu teléfono. El detalle está en la {link('/privacidad#placa', 'Política de Privacidad')}.
        </p>
        <p>
          Sos responsable de los datos que cargás y publicás. No somos responsables por lo que terceros hagan con la información que elegiste mostrar, ni por el contacto que recibas de quien encuentre a tu mascota.
        </p>
      </>
    ),
  },
  {
    id: 'salud',
    title: 'PetHealth no reemplaza al veterinario',
    body: (
      <>
        <p>
          PetHealth es una herramienta para ordenar información. <strong>No brinda diagnósticos ni consejos veterinarios</strong> y no reemplaza la consulta con un profesional. La información de salud la cargás vos y sos responsable de que sea correcta. Si compartís una mascota, las personas que invites también pueden cargar y editar información: vos decidís a quién darle acceso y podés quitarlo cuando quieras.
        </p>
        <p>
          Los recordatorios por email son una ayuda: pueden llegar tarde, ir a la carpeta de spam o no llegar por problemas ajenos a nosotros. No reemplazan el seguimiento que indique tu veterinario.
        </p>
      </>
    ),
  },
  {
    id: 'uso',
    title: 'Uso aceptable',
    body: (
      <>
        <p>Al usar PetHealth te comprometés a no:</p>
        <ul>
          <li>Cargar contenido ilegal, ofensivo o que infrinja derechos de terceros.</li>
          <li>Publicar datos personales de otras personas sin su consentimiento.</li>
          <li>Intentar acceder a cuentas o datos ajenos, sobrecargar el servicio o vulnerar su seguridad.</li>
          <li>Usar el servicio para fines distintos al cuidado de tus mascotas, como enviar publicidad o spam.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'contenido',
    title: 'Tu contenido',
    body: (
      <p>
        La información, fotos y archivos que cargás son tuyos. Nos das permiso para guardarlos, procesarlos y mostrarlos solo en la medida necesaria para prestarte el servicio (por ejemplo, mostrar la foto de tu mascota en su placa). No los vendemos ni los usamos con fines publicitarios.
      </p>
    ),
  },
  {
    id: 'disponibilidad',
    title: 'Disponibilidad del servicio',
    body: (
      <p>
        Trabajamos para que PetHealth esté disponible siempre, pero puede haber interrupciones por mantenimiento, fallas técnicas o problemas de nuestros proveedores. Vamos a intentar avisarte con anticipación de los mantenimientos programados. Te recomendamos conservar también los documentos originales importantes de tu mascota.
      </p>
    ),
  },
  {
    id: 'responsabilidad',
    title: 'Responsabilidad',
    body: (
      <p>
        En la medida en que lo permita la ley, PetHealth no es responsable por daños que resulten de información incorrecta cargada por los usuarios, del uso que terceros hagan de los datos públicos de la placa, ni de interrupciones del servicio ajenas a nuestro control. Nada de lo establecido en estos términos limita los derechos que te otorga la Ley 24.240 de Defensa del Consumidor.
      </p>
    ),
  },
  {
    id: 'baja',
    title: 'Suspensión y baja de la cuenta',
    body: (
      <>
        <p>
          Podés pedir la baja de tu cuenta en cualquier momento escribiendo a {contact}. Eliminamos tus datos como se explica en la {link('/privacidad#conservacion', 'Política de Privacidad')}.
        </p>
        <p>
          Podemos suspender o dar de baja una cuenta que incumpla estos términos. Salvo que el incumplimiento sea grave o ponga en riesgo el servicio o a otras personas, te vamos a avisar antes y te vamos a dar la posibilidad de descargar o pedir tu información.
        </p>
      </>
    ),
  },
  {
    id: 'propiedad',
    title: 'Propiedad intelectual',
    body: (
      <p>
        La marca PetHealth, su logo, la mascota Placo, el diseño y el software de la aplicación son de nuestra propiedad o los usamos con autorización. No podés copiarlos ni usarlos sin permiso.
      </p>
    ),
  },
  {
    id: 'cambios',
    title: 'Cambios en estos términos',
    body: (
      <p>
        Podemos actualizar estos términos. Si el cambio es importante, te vamos a avisar por email o dentro de la aplicación con al menos 15 días de anticipación. Si no estás de acuerdo, podés dar de baja tu cuenta antes de que entre en vigencia.
      </p>
    ),
  },
  {
    id: 'ley',
    title: 'Ley aplicable y jurisdicción',
    body: (
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Cualquier conflicto se va a resolver ante los tribunales competentes según la normativa de defensa del consumidor, incluidos los de tu domicilio. También podés hacer reclamos ante la autoridad de defensa del consumidor de tu jurisdicción o a través de la plataforma nacional de reclamos de consumo.
      </p>
    ),
  },
]

export function Terms() {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      intro={
        <p>
          Estos términos explican cómo funciona PetHealth, qué podés esperar de nosotros y qué esperamos de vos. Los escribimos para que se entiendan sin ser abogado.
        </p>
      }
      sections={sections}
    />
  )
}
