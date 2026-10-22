from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from PIL import Image as PILImage
root=Path('output'); styles=getSampleStyleSheet(); story=[]
items=[('Sin sesión: /ventas redirige al login','01-sin-sesion.png'),('Formulario vacío: validación de ambos campos','02-validacion.png'),('Credenciales incorrectas: mensaje genérico','03-credenciales.png'),('Cuenta inactiva: mismo mensaje genérico','04-inactivo.png'),('Vendedor: regreso a /ventas y datos de sesión','05-vendedor-ventas.png'),('Authorization en GET /productos',None),('Sesión en sessionStorage',None),('Recarga: permanece en Productos con sesión','08-recarga.png'),('Vendedor: catálogo sin acciones de escritura','09-solo-lectura.png'),('Vendedor: /productos/nuevo denegado','10-guard-productos.png'),('Con sesión: /login lleva a /inicio','11-invitado-guard.png'),('Cerrar sesión: regreso al login','12-cerrar-sesion.png'),('Almacén: ventas oculta y acceso directo denegado','13-almacen-ventas.png'),('Supervisor: ventas y edición de catálogo','14-supervisor.png'),('Token alterado y 401',None),('Expiración real a un minuto',None)]
story += [Paragraph('PharmaSoft | Sesión 11', styles['Title']),Spacer(1,18),Paragraph('Seguridad frontend - Informe de avance y evidencias',styles['Heading1']),Paragraph('Rama: feature/seguridad-frontend-asmat<br/>Fecha: 22/10/2026<br/>Estudiante: Asmat (completar nombres y código)',styles['BodyText']),Spacer(1,16),Paragraph('Implementación: login, sessionStorage, expiración automática, interceptores, guards, menú y botones por permisos. Incluye Mi cuenta y aviso un minuto antes del vencimiento.',styles['BodyText']),Spacer(1,16),Paragraph('Alcance de las evidencias',styles['Heading2']),Paragraph('Este informe contiene capturas reales de 12 de los 16 casos y una captura adicional de Mi cuenta. Los casos 6, 7, 15 y 16 requieren evidencia manual de DevTools o expiración real. Las pruebas HTTP simuladas no sustituyen esas capturas. Las capturas de página no incluyen la barra de direcciones ni DevTools.',styles['BodyText']),Spacer(1,16),Paragraph('API local verificada: admin, vendedor, almacen y supervisor inician sesión (200); inactivo recibe 401. Almacén recibe 403 en ventas; vendedor, almacén y supervisor reciben 403 en reportes. No se modificaron datos de negocio.',styles['BodyText'])]
for i,(title,file) in enumerate(items,1):
 story += [PageBreak(),Paragraph(f'Prueba {i:02}: {title}',styles['Heading1']),Spacer(1,14)]
 if file:
  image=root/'evidencias-s11'/file
  with PILImage.open(image) as im: width,height=im.size
  factor=min(475/width,620/height)
  story += [Image(str(image),width=width*factor,height=height*factor),Spacer(1,12),Paragraph('Evidencia: captura de la SPA local durante la comprobación.',styles['BodyText'])]
 else:
  detail={6:'Pendiente: F12 > Red > GET /productos > Request Headers. Confirmar Bearer; no publicar el token completo. La prueba automatizada comprueba también que no se envía al login ni a otros destinos.',7:'Pendiente: F12 > Aplicación > Session Storage > pharmasoft.sesion. Comprobar token, expiraEn y permisos; ocultar el valor completo del token.',15:'Pendiente: alterar un carácter del token en sessionStorage, recargar y capturar el 401 y el aviso del login. El interceptor ya se verificó con HTTP 401 simulado.',16:'Pendiente: configurar temporalmente la expiración del backend a un minuto, reiniciar, iniciar sesión y esperar. Restaurar 60 minutos al finalizar. La temporización del frontend se verificó con reloj simulado.'}[i]
  story += [Paragraph('ESTADO: PENDIENTE DE EVIDENCIA MANUAL',styles['Heading2']),Paragraph(detail,styles['BodyText'])]
story += [PageBreak(),Paragraph('Actividad autónoma: Mi cuenta',styles['Heading1']),Spacer(1,14)]
file=root/'evidencias-s11/17-mi-cuenta.png'
with PILImage.open(file) as im: width,height=im.size
factor=min(475/width,620/height);story.append(Image(str(file),width=width*factor,height=height*factor))
def footer(c,d):
 c.setFont('Helvetica',9);c.drawString(42,25,'LP II - PharmaSoft - Sesión 11');c.drawRightString(550,25,str(d.page))
SimpleDocTemplate(str(root/'pdf/Asmat_LP2_S11_Practica.pdf'),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=42).build(story,onFirstPage=footer,onLaterPages=footer)
