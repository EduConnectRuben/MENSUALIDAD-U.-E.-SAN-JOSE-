from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String)
    rol = Column(String) # 'admin', 'secretaria' o 'director'

class CajaTransaccion(Base):
    __tablename__ = "caja_transacciones"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String) # 'ingreso' o 'egreso'
    monto = Column(Float)
    descripcion = Column(String)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

class Padre(Base):
    __tablename__ = "padres"

    id = Column(Integer, primary_key=True, index=True)
    carnet = Column(String, unique=True, index=True)
    nombre_completo = Column(String)

    estudiantes = relationship("Estudiante", back_populates="padre")
    recibos = relationship("Recibo", back_populates="padre")

class Estudiante(Base):
    __tablename__ = "estudiantes"

    id = Column(Integer, primary_key=True, index=True)
    nombres = Column(String)
    apellidos = Column(String)
    ci = Column(String, nullable=True) # Carnet de estudiante
    curso = Column(String)  # Ej: Kinder, Primero, Segundo
    paralelo = Column(String) # Ej: A, B, C
    padre_id = Column(Integer, ForeignKey("padres.id"), nullable=True)
    estado_pago = Column(String, default="Pendiente") # 'Pendiente', 'Cancelado', o meses
    estado_matricula = Column(String, default="Activo") # 'Activo' o 'Retirado'

    padre = relationship("Padre", back_populates="estudiantes")
    detalles_recibo = relationship("DetalleRecibo", back_populates="estudiante")

class Recibo(Base):
    __tablename__ = "recibos"

    id = Column(Integer, primary_key=True, index=True)
    nro_recibo = Column(String, unique=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    monto = Column(Float, default=50.0)
    padre_id = Column(Integer, ForeignKey("padres.id"))

    padre = relationship("Padre", back_populates="recibos")
    detalles = relationship("DetalleRecibo", back_populates="recibo")

class DetalleRecibo(Base):
    __tablename__ = "detalles_recibo"

    id = Column(Integer, primary_key=True, index=True)
    recibo_id = Column(Integer, ForeignKey("recibos.id"))
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"))

    recibo = relationship("Recibo", back_populates="detalles")
    estudiante = relationship("Estudiante", back_populates="detalles_recibo")
