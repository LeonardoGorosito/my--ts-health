import { Link } from 'react-router-dom'
import { LegalLayout, Fill } from '../../components/LegalLayout'
import type { LegalSection } from '../../components/LegalLayout'
import { LEGAL } from '../../lib/legal'

const contact = <Fill value={LEGAL.email} label="email de contacto" />

const sections: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Quién es responsable de tus datos',
    body: (
      <>
        <p>
          El responsable de la base de datos y del tratamiento de tus datos personales es <Fill value={LEGAL.owner} label="nombre o razón social" />
          {LEGAL.taxId && <> (CUIT {LEGAL.taxId})</>}, con domicilio en {LEGAL.city}. Podés contactarnos en {contact}.
        </p>
        <p>
          Tratamos tus datos de acuerdo con la Ley N° 25.326 de Protección de los Datos Personales, su decreto reglamentario y las normas de la Agencia de Acceso a la Información Pública (AAIP).
        </p>
      </>
    ),
  },
  {
    id: 'datos',
    title: 'Qué datos recopilamos',
    body: (
      <>
        <p>Solo guardamos lo que vos cargás o lo que es necesario para que el servicio funcione:</p>
        <ul>
          <li><strong>Datos de tu cuenta:</strong> nombre, apellido, email y contraseña (guardada cifrada, nunca en texto plano). De forma opcional: teléfono, dirección y los contactos de tu veterinaria y guardia de emergencias.</li>
          <li><strong>Datos de tus mascotas:</strong> nombre, especie, raza, sexo, fecha de nacimiento, peso, castración, necesidades especiales y fotos.</li>
          <li><strong>Información de salud de tus mascotas:</strong> vacunas, desparasitaciones, historial médico y los archivos que adjuntes (estudios, análisis, recetas). Estos archivos pueden incluir datos tuyos o de tu veterinaria si figuran en el documento.</li>
          <li><strong>Datos de tu suscripción y preferencias:</strong> plan, fechas de la prueba y del plan, y si querés recibir recordatorios por email.</li>
          <li><strong>Datos técnicos:</strong> la dirección IP desde la que te conectás, que usamos para limitar intentos de acceso y prevenir abusos, y los registros técnicos que genera nuestro proveedor de hosting.</li>
        </ul>
        <p>No usamos herramientas de publicidad ni de seguimiento de terceros.</p>
      </>
    ),
  },
  {
    id: 'finalidad',
    title: 'Para qué usamos tus datos',
    body: (
      <ul>
        <li>Crear y administrar tu cuenta, y verificar tu email.</li>
        <li>Guardar y mostrarte la información de tus mascotas.</li>
        <li>Mostrar la placa pública de cada mascota a quien escanee su código QR (ver el punto siguiente).</li>
        <li>Enviarte emails necesarios para el servicio: códigos de verificación y recuperación de contraseña y, si los tenés activados, recordatorios de vencimientos.</li>
        <li>Gestionar tu prueba gratis y tu plan.</li>
        <li>Proteger el servicio: prevenir accesos no autorizados, fraudes y abusos.</li>
      </ul>
    ),
  },
  {
    id: 'placa',
    title: 'Qué se ve en la placa QR pública',
    body: (
      <>
        <p>
          La placa de cada mascota es una página <strong>pública</strong>: cualquier persona que escanee el código QR o tenga el link puede verla, sin necesidad de una cuenta. No la indexamos en buscadores.
        </p>
        <ul>
          <li><strong>Siempre se muestran:</strong> el nombre, la foto, la raza, el sexo y las necesidades especiales de la mascota, tu nombre y tu email de contacto.</li>
          <li><strong>Tu teléfono</strong> se muestra solo si lo habilitás en la configuración de la mascota, o mientras esté activado el <strong>modo mascota perdida</strong>.</li>
          <li><strong>Tu dirección</strong> se muestra solo si la habilitás.</li>
          <li>Si activás el modo mascota perdida, también se muestran la fecha y el mensaje que escribas.</li>
        </ul>
        <p>El historial médico, las vacunas y los archivos adjuntos <strong>nunca</strong> se muestran en la placa.</p>
      </>
    ),
  },
  {
    id: 'terceros',
    title: 'Con quién compartimos tus datos',
    body: (
      <>
        <p><strong>No vendemos ni alquilamos tus datos.</strong> Para que el servicio funcione, usamos estos proveedores, que tratan los datos solo por cuenta nuestra:</p>
        <ul>
          <li><strong>Vercel:</strong> alojamiento de la aplicación.</li>
          <li><strong>Neon:</strong> base de datos.</li>
          <li><strong>Cloudinary:</strong> almacenamiento de fotos y archivos adjuntos.</li>
          <li><strong>Resend:</strong> envío de emails.</li>
        </ul>
        <p>
          Estos proveedores pueden almacenar los datos en servidores fuera de la Argentina, principalmente en los Estados Unidos. Al aceptar esta política, prestás tu consentimiento para esa transferencia internacional, que se hace con proveedores que aplican medidas de seguridad adecuadas.
        </p>
        <p>También podemos compartir datos si una autoridad competente lo exige por ley.</p>
      </>
    ),
  },
  {
    id: 'almacenamiento-local',
    title: 'Cookies y almacenamiento en tu navegador',
    body: (
      <p>
        No usamos cookies de publicidad ni de seguimiento. Guardamos en tu navegador (almacenamiento local) solo dos cosas: la sesión iniciada, para que no tengas que volver a ingresar en cada visita, y el tema que elegiste (claro u oscuro). Podés borrarlas cerrando sesión o limpiando los datos del sitio en tu navegador.
      </p>
    ),
  },
  {
    id: 'conservacion',
    title: 'Cuánto tiempo guardamos tus datos',
    body: (
      <>
        <p>
          Guardamos tus datos mientras tu cuenta esté activa. Si tu prueba o tu plan vencen, conservamos la información en modo de solo lectura para que no la pierdas si volvés.
        </p>
        <p>
          Cuando borrás una mascota se eliminan sus registros y archivos. Si pedís la baja de tu cuenta, eliminamos tus datos, salvo los que debamos conservar por obligaciones legales (por ejemplo, registros de pagos).
        </p>
      </>
    ),
  },
  {
    id: 'derechos',
    title: 'Tus derechos',
    body: (
      <>
        <p>Como titular de los datos tenés derecho a:</p>
        <ul>
          <li><strong>Acceder</strong> a tus datos de forma gratuita, en intervalos no menores a seis meses, salvo que acredites un interés legítimo.</li>
          <li><strong>Rectificarlos y actualizarlos.</strong> La mayoría podés editarlos directamente desde tu perfil y desde la ficha de cada mascota.</li>
          <li><strong>Pedir su supresión,</strong> incluida la baja de tu cuenta.</li>
        </ul>
        <p>
          Para ejercerlos, escribinos a {contact} desde el email de tu cuenta. Respondemos los pedidos de acceso dentro de los 10 días corridos y los de rectificación o supresión dentro de los 5 días hábiles, como establece la Ley 25.326.
        </p>
        <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
          LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
        </p>
      </>
    ),
  },
  {
    id: 'seguridad',
    title: 'Cómo protegemos tus datos',
    body: (
      <p>
        Toda la comunicación viaja cifrada (HTTPS), las contraseñas se guardan cifradas, cada usuario solo puede ver y modificar sus propias mascotas, y limitamos los intentos de acceso para prevenir ataques. Ningún sistema es 100% invulnerable: si detectamos un incidente que afecte tus datos, te lo vamos a informar.
      </p>
    ),
  },
  {
    id: 'menores',
    title: 'Menores de edad',
    body: <p>PetHealth está dirigido a personas mayores de 18 años. No recopilamos a sabiendas datos de menores de edad.</p>,
  },
  {
    id: 'cambios',
    title: 'Cambios en esta política',
    body: (
      <p>
        Si cambiamos esta política de forma importante, te vamos a avisar por email o dentro de la aplicación antes de que el cambio entre en vigencia. La fecha de la última actualización figura al principio de esta página.
      </p>
    ),
  },
]

export function Privacy() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      intro={
        <p>
          En PetHealth cuidamos los datos de tus mascotas y los tuyos. Esta política explica qué información guardamos, para qué la usamos, quién puede verla y cómo podés controlarla. Complementa los <Link to="/terminos" className="text-emerald-700 underline dark:text-emerald-400">Términos y Condiciones</Link>.
        </p>
      }
      sections={sections}
    />
  )
}
