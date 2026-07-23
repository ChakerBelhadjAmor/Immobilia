"""Investor endpoints — Agent 2 (Dealing + Portfolio).

Routers hold no business logic (project convention): every handler here
delegates to `app.services.bmv`, `app.services.investment_alerts`, or
`app.services.dealing_portfolio`. See those modules' docstrings for the
persistence boundaries (`app/services/investor_ports.py`) this router is
built against.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from mistralai.client import Mistral

from app.agents.base.client import get_mistral
from app.core.config import get_settings
from app.core.deps import get_current_user_id
from app.schemas.investor import (
    AlertEvaluationRequest,
    AlertEvaluationResult,
    AlertRule,
    AlertRuleCreate,
    AlertRuleUpdate,
    BMVRankingRequest,
    BMVRankingResponse,
    PortfolioStrategyRequest,
    PortfolioStrategyResponse,
    PropertySnapshot,
    TriggeredNotification,
)
from app.services import bmv as bmv_service
from app.services import dealing_portfolio as strategy_service
from app.services import investment_alerts as alerts_service
from app.services.investor_ports import (
    AlertRuleNotFoundError,
    AlertRuleRepository,
    NotificationPublisher,
    NotificationRepository,
    PropertyRepositoryUnavailableError,
    PropertyValuationRepository,
    get_alert_rule_repository,
    get_notification_publisher,
    get_notification_repository,
    get_property_valuation_repository,
)

router = APIRouter(prefix="/investor", tags=["investor"])

CurrentUserId = Annotated[str, Depends(get_current_user_id)]
AlertRuleRepo = Annotated[AlertRuleRepository, Depends(get_alert_rule_repository)]
NotificationRepo = Annotated[NotificationRepository, Depends(get_notification_repository)]
NotificationPub = Annotated[NotificationPublisher, Depends(get_notification_publisher)]
PropertyValuationRepo = Annotated[
    PropertyValuationRepository, Depends(get_property_valuation_repository)
]
MistralClient = Annotated[Mistral, Depends(get_mistral)]


async def _lookup_properties(
    valuation_repo: PropertyValuationRepository, property_ids: list[str]
) -> list[PropertySnapshot]:
    try:
        return await valuation_repo.get_by_ids(property_ids)
    except PropertyRepositoryUnavailableError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc


@router.post("/strategy", response_model=PortfolioStrategyResponse)
async def generate_strategy(
    payload: PortfolioStrategyRequest,
    _investor_id: CurrentUserId,
    mistral: MistralClient,
) -> PortfolioStrategyResponse:
    settings = get_settings()
    return await strategy_service.generate_portfolio_strategy(
        payload.investor_profile, mistral, model=settings.mistral_model
    )


@router.post("/bmv/rank", response_model=BMVRankingResponse)
async def rank_bmv_opportunities(
    payload: BMVRankingRequest,
    _investor_id: CurrentUserId,
    valuation_repo: PropertyValuationRepo,
) -> BMVRankingResponse:
    properties = await _lookup_properties(valuation_repo, payload.property_ids)
    results = bmv_service.rank_bmv_opportunities(properties, payload.min_discount_threshold_pct)
    return BMVRankingResponse(results=results)


@router.post("/alerts", response_model=AlertRule, status_code=status.HTTP_201_CREATED)
async def create_alert_rule(
    payload: AlertRuleCreate,
    investor_id: CurrentUserId,
    repo: AlertRuleRepo,
) -> AlertRule:
    return await repo.create(investor_id, payload)


@router.get("/alerts", response_model=list[AlertRule])
async def list_alert_rules(
    investor_id: CurrentUserId,
    repo: AlertRuleRepo,
) -> list[AlertRule]:
    return await repo.list_for_investor(investor_id)


@router.get("/alerts/{rule_id}", response_model=AlertRule)
async def get_alert_rule(
    rule_id: str,
    investor_id: CurrentUserId,
    repo: AlertRuleRepo,
) -> AlertRule:
    try:
        return await repo.get(investor_id, rule_id)
    except AlertRuleNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Alert rule not found") from exc


@router.patch("/alerts/{rule_id}", response_model=AlertRule)
async def update_alert_rule(
    rule_id: str,
    payload: AlertRuleUpdate,
    investor_id: CurrentUserId,
    repo: AlertRuleRepo,
) -> AlertRule:
    try:
        return await repo.update(investor_id, rule_id, payload)
    except AlertRuleNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Alert rule not found") from exc


@router.post("/alerts/{rule_id}/evaluate", response_model=AlertEvaluationResult)
async def evaluate_alert_rule(
    rule_id: str,
    payload: AlertEvaluationRequest,
    investor_id: CurrentUserId,
    alert_repo: AlertRuleRepo,
    notification_repo: NotificationRepo,
    notification_publisher: NotificationPub,
    valuation_repo: PropertyValuationRepo,
) -> AlertEvaluationResult:
    properties = await _lookup_properties(valuation_repo, payload.candidate_property_ids)
    bmv_results = bmv_service.rank_bmv_opportunities(properties, payload.min_discount_threshold_pct)
    bmv_by_id = {result.property_id: result for result in bmv_results}
    candidates = [(prop, bmv_by_id.get(prop.property_id)) for prop in properties]

    try:
        return await alerts_service.run_alert_evaluation(
            investor_id,
            rule_id,
            candidates,
            alert_rule_repo=alert_repo,
            notification_repo=notification_repo,
            notification_publisher=notification_publisher,
        )
    except AlertRuleNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Alert rule not found") from exc


@router.get("/notifications", response_model=list[TriggeredNotification])
async def list_notifications(
    investor_id: CurrentUserId,
    notification_repo: NotificationRepo,
) -> list[TriggeredNotification]:
    return await notification_repo.list_for_investor(investor_id)
