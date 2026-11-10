import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toFormData, toHttpParams } from './api-base-url';
import {
  ActiveSubstanceDto, BbchStageDto, CatalogDiagnosesQuery, CatalogDiagnosisDto, CatalogPackDto, CatalogPackQuery,
  CatalogStatusDto, CreateProposalRequest, CropDto, Page, ProductDto, ProductRegistrationDto, ProductsQuery,
  ProposalDto, ProposalsQuery, ReferenceImageDto, ReferenceImageUploadRequest, ThresholdDto, ThresholdsQuery,
  VerifyCatalogRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class CatalogApi extends ApiClient {
  crops(): Observable<CropDto[]> {
    return this.http.get<CropDto[]>(this.url('/catalog/crops'));
  }

  bbchStages(cropId: string): Observable<BbchStageDto[]> {
    return this.http.get<BbchStageDto[]>(this.url(`/catalog/crops/${cropId}/bbch`));
  }

  diagnoses(query: CatalogDiagnosesQuery = {}): Observable<CatalogDiagnosisDto[]> {
    return this.http.get<CatalogDiagnosisDto[]>(this.url('/catalog/diagnoses'), { params: toHttpParams(query) });
  }

  references(diagnosisId: string): Observable<ReferenceImageDto[]> {
    return this.http.get<ReferenceImageDto[]>(this.url(`/catalog/diagnoses/${diagnosisId}/references`));
  }

  thresholds(query: ThresholdsQuery = {}): Observable<ThresholdDto[]> {
    return this.http.get<ThresholdDto[]>(this.url('/catalog/thresholds'), { params: toHttpParams(query) });
  }

  products(query: ProductsQuery = {}): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(this.url('/catalog/products'), { params: toHttpParams(query) });
  }

  registrations(productId: string): Observable<ProductRegistrationDto[]> {
    return this.http.get<ProductRegistrationDto[]>(this.url(`/catalog/products/${productId}/registrations`));
  }

  activeSubstances(): Observable<ActiveSubstanceDto[]> {
    return this.http.get<ActiveSubstanceDto[]>(this.url('/catalog/active-substances'));
  }

  status(region?: string): Observable<CatalogStatusDto> {
    return this.http.get<CatalogStatusDto>(this.url('/catalog/status'), { params: toHttpParams({ region }) });
  }

  pack(query: CatalogPackQuery = {}): Observable<CatalogPackDto> {
    return this.http.get<CatalogPackDto>(this.url('/catalog/pack'), { params: toHttpParams(query) });
  }

  proposals(query: ProposalsQuery = {}): Observable<Page<ProposalDto>> {
    return this.http.get<Page<ProposalDto>>(this.url('/catalog/proposals'), { params: toHttpParams(query) });
  }

  createProposal(body: CreateProposalRequest): Observable<ProposalDto> {
    return this.http.post<ProposalDto>(this.url('/catalog/proposals'), body);
  }

  approveProposal(id: string, comment?: string): Observable<ProposalDto> {
    return this.http.post<ProposalDto>(this.url(`/catalog/proposals/${id}/approve`), { comment });
  }

  rejectProposal(id: string, comment: string): Observable<ProposalDto> {
    return this.http.post<ProposalDto>(this.url(`/catalog/proposals/${id}/reject`), { comment });
  }

  uploadReferenceImage(request: ReferenceImageUploadRequest): Observable<ProposalDto> {
    return this.http.post<ProposalDto>(this.url('/catalog/reference-images'), toFormData({ ...request }));
  }

  referenceImageFileUrl(id: string): string {
    return this.url(`/catalog/reference-images/${id}/file`);
  }

  verify(body: VerifyCatalogRequest): Observable<CatalogStatusDto> {
    return this.http.post<CatalogStatusDto>(this.url('/catalog/verify'), body);
  }
}
