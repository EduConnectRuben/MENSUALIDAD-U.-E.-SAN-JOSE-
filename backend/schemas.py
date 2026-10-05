from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EstudianteBase(BaseModel):
    nombres: str
    apellidos: str
    ci: Optional[str] = None
    curso: str
    paralelo: str
    padre_id: Optional[int] = None
    estado_pago: Optional[str] = "Pendiente"
    estado_matricula: Optional[str] = "Activo"

class EstudianteCreate(EstudianteBase):
    pass

class Estudiante(EstudianteBase):
    id: int

    class Config:
        from_attributes = True

class PadreBase(BaseModel):
    carnet: str
    nombre_completo: str

class PadreCreate(PadreBase):
    pass

class Padre(PadreBase):
    id: int
    estudiantes: List[Estudiante] = []

    class Config:
        from_attributes = True

class DetalleReciboBase(BaseModel):
    estudiante_id: int

class DetalleReciboCreate(DetalleReciboBase):
    pass

class DetalleRecibo(DetalleReciboBase):
    id: int
    recibo_id: int
    estudiante: Estudiante

    class Config:
        from_attributes = True

class ReciboBase(BaseModel):
    padre_id: int
    monto: float = 50.0

class ReciboCreate(ReciboBase):
    estudiantes_ids: List[int]
    meses: List[str] = []

class Recibo(ReciboBase):
    id: int
    nro_recibo: str
    fecha: datetime
    detalles: List[DetalleRecibo] = []
    padre: Padre

    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    username: str
    rol: str

class UsuarioCreate(UsuarioBase):
    password: str

class Usuario(UsuarioBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    rol: str
    username: Optional[str] = None

class CambiarPassword(BaseModel):
    password_actual: str
    password_nuevo: str

class ResetPassword(BaseModel):
    username: str
    email: str

class TokenData(BaseModel):
    username: Optional[str] = None
    rol: Optional[str] = None

class CajaTransaccionBase(BaseModel):
    tipo: str
    monto: float
    descripcion: str

class CajaTransaccionCreate(CajaTransaccionBase):
    pass

class CajaTransaccion(CajaTransaccionBase):
    id: int
    fecha: datetime
    usuario_id: Optional[int] = None

    class Config:
        from_attributes = True

class CajaInforme(BaseModel):
    total_ingresos: float
    total_egresos: float
    saldo_actual: float
    transacciones: List[CajaTransaccion]
