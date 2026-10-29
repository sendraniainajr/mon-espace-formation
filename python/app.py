from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List

from ticket_manager import Ticket, TicketManager

app = FastAPI(
    title="Mon espace formation API",
    description="API simple pour gérer les tickets IT d'un apprenant en support informatique.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = TicketManager()


class TicketCreateRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    priority: str = "Moyenne"
    category: str = "Général"
    status: str = "Ouvert"


class TicketUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "message": "API opérationnelle"}


@app.get("/tickets", response_model=List[dict])
def list_tickets(
    query: Optional[str] = Query(default=""),
    priority: Optional[str] = None,
    status: Optional[str] = None,
) -> List[dict]:
    tickets = manager.list_tickets(query=query, priority=priority, status=status)
    return [ticket.to_dict() for ticket in tickets]


@app.post("/tickets", response_model=dict)
def create_ticket(payload: TicketCreateRequest) -> dict:
    try:
        ticket = Ticket(
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            category=payload.category,
            status=payload.status,
        )
        return manager.add_ticket(ticket).to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.put("/tickets/{ticket_id}", response_model=dict)
def update_ticket(ticket_id: str, payload: TicketUpdateRequest) -> dict:
    for ticket in manager.tickets:
        if ticket.ticket_id == ticket_id:
            if payload.title is not None:
                ticket.title = payload.title
            if payload.description is not None:
                ticket.description = payload.description
            if payload.priority is not None:
                ticket.priority = payload.priority
            if payload.category is not None:
                ticket.category = payload.category
            if payload.status is not None:
                ticket.status = payload.status
            try:
                manager.validate_ticket(ticket)
                return ticket.to_dict()
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
    raise HTTPException(status_code=404, detail="Ticket non trouvé.")


@app.delete("/tickets/{ticket_id}", response_model=dict)
def delete_ticket(ticket_id: str) -> dict:
    for index, ticket in enumerate(manager.tickets):
        if ticket.ticket_id == ticket_id:
            deleted = manager.tickets.pop(index)
            return {"deleted": True, "ticket": deleted.to_dict()}
    raise HTTPException(status_code=404, detail="Ticket non trouvé.")


@app.post("/tickets/{ticket_id}/close", response_model=dict)
def close_ticket(ticket_id: str) -> dict:
    try:
        ticket = manager.close_ticket(ticket_id)
        return {"updated": True, "ticket": ticket.to_dict()}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/tickets/export.csv")
def export_tickets_csv() -> str:
    return manager.export_csv()
