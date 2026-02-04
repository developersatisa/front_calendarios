import { FC, useState, useEffect } from 'react'
import { useAuth } from '../../modules/auth/core/Auth'
import { getAllPersonas, Persona } from '../../api/personas'
import { updateRole, getRoleByEmail, createRole } from '../../api/apiRoles'
import { atisaStyles } from '../../styles/atisaStyles'
import SharedPagination from '../../components/pagination/SharedPagination'
import CustomToast from '../../components/ui/CustomToast'

const AdministradoresPage: FC = () => {
    const { auth, currentUser } = useAuth()
    const [personas, setPersonas] = useState<Persona[]>([])
    const [loading, setLoading] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    // Toast State
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')

    // Paginación y Filtrado
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)

    // Verificar si el usuario logueado es admin usando el nuevo endpoint
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                if (currentUser?.email) {
                    const roleData = await getRoleByEmail(currentUser.email)
                    // Si returns 1 or true, es admin
                    const isUserAdmin = roleData.admin === 1 || roleData.admin === true
                    setIsAdmin(isUserAdmin)
                }
            } catch (error) {
                console.error("Error verificando rol de admin", error)
                setIsAdmin(false)
            }
        }

        checkAdminStatus()
    }, [currentUser])

    const loadData = async () => {
        setLoading(true)
        try {
            const personasData = await getAllPersonas()
            setPersonas(personasData || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleToggleAdmin = async (email: string, isCurrentlyAdmin: boolean, roleId: number | null, fullName: string) => {
        try {
            if (roleId) {
                // Si existe registro en api_roles, actualizamos
                await updateRole(roleId, !isCurrentlyAdmin)
            } else {
                // Si no existe y queremos hacerlo admin (actualmente no lo es), creamos
                if (!isCurrentlyAdmin) {
                    await createRole(email)
                }
            }

            setToastMessage(`Rol actualizado correctamente para ${fullName}`)
            setToastType('success')
            setShowToast(true)

            loadData()
        } catch (error) {
            console.error("Error toggling admin", error)
            setToastMessage('Error al actualizar permisos')
            setToastType('error')
            setShowToast(true)
        }
    }

    // Lógica Buscador + Paginación Local
    const filteredPersonas = personas.filter(p => {
        const term = searchTerm.toLowerCase()
        const nombre = p.Nombre ? p.Nombre.trim().toLowerCase() : ''
        const apellido1 = p.Apellido1 ? p.Apellido1.trim().toLowerCase() : ''
        const apellido2 = p.Apellido2 ? p.Apellido2.trim().toLowerCase() : ''

        // Búsqueda por nombre completo
        const fullName = `${nombre} ${apellido1} ${apellido2}`.trim()

        const email = p.email ? p.email.toLowerCase() : ''
        const nif = p.NIF ? p.NIF.toLowerCase() : ''

        return fullName.includes(term) ||
            email.includes(term) ||
            nif.includes(term)
    })

    const totalItems = filteredPersonas.length
    const indexOfLastItem = currentPage * pageSize
    const indexOfFirstItem = indexOfLastItem - pageSize
    const currentItems = filteredPersonas.slice(indexOfFirstItem, indexOfLastItem)

    return (
        <div style={{
            fontFamily: atisaStyles.fonts.secondary,
            boxShadow: '0 4px 20px rgba(0, 80, 92, 0.1)',
            border: `1px solid ${atisaStyles.colors.light}`,
            borderRadius: '12px',
            overflow: 'hidden',
            margin: 0,
            width: '100%'
        }}>
            <div
                className='card-header border-0 pt-6'
                style={{
                    background: 'linear-gradient(135deg, #00505c 0%, #007b8a 100%)',
                    color: 'white',
                    borderRadius: '8px 8px 0 0',
                    margin: 0,
                    padding: '24px 16px'
                }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', width: '100%' }}>
                    {/* Izquierda: Buscador */}
                    <div className='d-flex align-items-center gap-3' style={{ justifyContent: 'flex-start' }}>
                        <div className='d-flex align-items-center position-relative' style={{ position: 'relative' }}>
                            <i
                                className='bi bi-search position-absolute ms-6'
                                style={{ color: atisaStyles.colors.light, zIndex: 1 }}
                            ></i>
                            <input
                                type='text'
                                data-kt-user-table-filter="search"
                                className='form-control form-control-solid w-250px ps-14'
                                placeholder='Buscar por nombre, email o NIF...'
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    border: `2px solid ${atisaStyles.colors.light}`,
                                    borderRadius: '8px',
                                    fontFamily: atisaStyles.fonts.secondary,
                                    fontSize: '14px',
                                    height: '40px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Centro: Título */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <h3 style={{
                            fontFamily: atisaStyles.fonts.primary,
                            fontWeight: 'bold',
                            color: 'white',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            fontSize: '2rem'
                        }}>
                            Administradores del Sistema
                        </h3>
                    </div>

                    {/* Derecha: Espacio vacío (o botones futuros) */}
                    <div className='d-flex gap-2' style={{ justifyContent: 'flex-end' }}>
                        {/* Placeholder para mantener el grid balanceado */}
                    </div>
                </div>
            </div>

            <div className="card-body py-3">
                {loading ? (
                    <div className='d-flex justify-content-center py-5'>
                        <div
                            className='spinner-border'
                            role='status'
                            style={{
                                color: atisaStyles.colors.primary,
                                width: '3rem',
                                height: '3rem'
                            }}
                        >
                            <span className='visually-hidden'>Cargando...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive" style={{ margin: 0 }}>
                            <table
                                className="table align-middle table-row-dashed fs-6 gy-0"
                                style={{
                                    fontFamily: atisaStyles.fonts.secondary,
                                    borderCollapse: 'separate',
                                    borderSpacing: '0',
                                    margin: 0,
                                    width: '100%'
                                }}
                            >
                                <thead>
                                    <tr
                                        className="text-start fw-bold fs-7 text-uppercase gs-0"
                                        style={{
                                            backgroundColor: atisaStyles.colors.light,
                                            color: atisaStyles.colors.primary
                                        }}
                                    >
                                        <th className="min-w-150px ps-4" style={{
                                            padding: '12px 24px',
                                            borderBottom: `2px solid ${atisaStyles.colors.primary}20`
                                        }}>Usuario</th>
                                        <th className="min-w-125px" style={{
                                            padding: '12px 24px',
                                            borderBottom: `2px solid ${atisaStyles.colors.primary}20`
                                        }}>Email</th>
                                        <th className="min-w-125px" style={{
                                            padding: '12px 24px',
                                            borderBottom: `2px solid ${atisaStyles.colors.primary}20`
                                        }}>NIF</th>
                                        <th className="text-end min-w-100px pe-4" style={{
                                            padding: '12px 24px',
                                            borderBottom: `2px solid ${atisaStyles.colors.primary}20` // Corregido el nombre de la propiedad
                                        }}>Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 fw-semibold">
                                    {currentItems.map((persona, index) => {
                                        const email = persona.email ? persona.email.trim() : ''
                                        const nombre = persona.Nombre ? persona.Nombre.trim() : ''
                                        const apellido1 = persona.Apellido1 ? persona.Apellido1.trim() : ''
                                        const apellido2 = persona.Apellido2 ? persona.Apellido2.trim() : ''
                                        const nif = persona.NIF ? persona.NIF.trim() : ''
                                        const fullName = `${nombre} ${apellido1} ${apellido2}`.trim()

                                        // Asegurar que el valor se interpreta correctamente como booleano
                                        const isAdminActive = persona.admin === true ||
                                            persona.admin === 1 ||
                                            String(persona.admin) === 'true' ||
                                            String(persona.admin) === '1'

                                        return (
                                            <tr
                                                key={`${email}-${index}`}
                                                style={{
                                                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                                                    fontFamily: atisaStyles.fonts.secondary,
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = atisaStyles.colors.light
                                                    e.currentTarget.style.transform = 'translateY(-1px)'
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 80, 92, 0.1)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'
                                                    e.currentTarget.style.transform = 'translateY(0)'
                                                    e.currentTarget.style.boxShadow = 'none'
                                                }}
                                            >
                                                <td className="ps-4" style={{
                                                    padding: '16px 24px',
                                                    borderBottom: `1px solid ${atisaStyles.colors.light}`,
                                                    color: atisaStyles.colors.dark,
                                                    fontWeight: '600'
                                                }}>
                                                    <div className="d-flex flex-column">
                                                        <span className="text-gray-800 text-hover-primary mb-1">{fullName}</span>
                                                    </div>
                                                </td>
                                                <td style={{
                                                    padding: '16px 24px',
                                                    borderBottom: `1px solid ${atisaStyles.colors.light}`,
                                                    color: atisaStyles.colors.dark
                                                }}>{email}</td>
                                                <td style={{
                                                    padding: '16px 24px',
                                                    borderBottom: `1px solid ${atisaStyles.colors.light}`,
                                                    color: atisaStyles.colors.dark
                                                }}>{nif}</td>
                                                <td className="text-end pe-4" style={{
                                                    padding: '16px 24px',
                                                    borderBottom: `1px solid ${atisaStyles.colors.light}`
                                                }}>
                                                    <div className="form-check form-check-solid form-check-custom form-check-sm d-inline-block">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={isAdminActive}
                                                            onChange={() => handleToggleAdmin(email, isAdminActive, persona.id_api_rol, fullName)}
                                                            disabled={!email}
                                                            style={{
                                                                cursor: 'pointer',
                                                                width: '20px',
                                                                height: '20px',
                                                                border: `1px solid ${atisaStyles.colors.primary}`
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {currentItems.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-5" style={{ color: atisaStyles.colors.dark }}>
                                                <i className="bi bi-search fs-1 d-block mb-3" style={{ color: atisaStyles.colors.primary }}></i>
                                                No se encontraron usuarios
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalItems > 0 && (
                            <div className="d-flex justify-content-end pt-5">
                                <SharedPagination
                                    currentPage={currentPage}
                                    totalItems={totalItems}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            <CustomToast
                show={showToast}
                onClose={() => setShowToast(false)}
                message={toastMessage}
                type={toastType}
            />
        </div>
    )
}

export default AdministradoresPage
