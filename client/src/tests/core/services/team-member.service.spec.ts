import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TeamMemberService } from '../../../app/core/services/team-member.service';
import { MemberRole } from '../../../app/core/enums/enums';

describe('TeamMemberService', () => {
    let service: TeamMemberService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:5297/api/team-members';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(TeamMemberService);
        httpMock = TestBed.inject(HttpTestingController);

        // Constructor calls refresh() which makes a GET — flush it
        const initReq = httpMock.expectOne(apiUrl);
        initReq.flush([]);
    });

    afterEach(() => httpMock.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getAll should return members', () => {
        const mockMembers = [
            { id: '1', name: 'Alice', role: MemberRole.Lead, isActive: true, createdAt: '' }
        ];
        service.getAll().subscribe(members => {
            expect(members.length).toBe(1);
            expect(members[0].name).toBe('Alice');
        });
        const req = httpMock.expectOne(apiUrl);
        expect(req.request.method).toBe('GET');
        req.flush(mockMembers);
    });

    it('create should POST a new member', () => {
        service.create('Bob').subscribe(member => {
            expect(member.name).toBe('Bob');
        });
        // create() calls POST then refresh() calls GET
        const postReq = httpMock.expectOne(req => req.method === 'POST' && req.url === apiUrl);
        expect(postReq.request.body).toEqual({ name: 'Bob' });
        postReq.flush({ id: '2', name: 'Bob', role: MemberRole.Member, isActive: true, createdAt: '' });

        // flush the refresh GET from tap(() => this.refresh())
        const refreshReq = httpMock.expectOne(apiUrl);
        refreshReq.flush([]);
    });

    it('update should PUT updated member', () => {
        service.update('1', 'Alice Updated').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ name: 'Alice Updated' });
        req.flush({});

        // flush the refresh GET from tap
        const refreshReq = httpMock.expectOne(apiUrl);
        refreshReq.flush([]);
    });

    it('makeLead should PUT make-lead', () => {
        service.makeLead('2').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/2/make-lead`);
        expect(req.request.method).toBe('PUT');
        req.flush({});

        // flush the refresh GET from tap
        const refreshReq = httpMock.expectOne(apiUrl);
        refreshReq.flush([]);
    });

    it('remove should DELETE member', () => {
        service.remove('2').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/2`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});

        // flush the refresh GET from tap
        const refreshReq = httpMock.expectOne(apiUrl);
        refreshReq.flush([]);
    });

    it('checkExists should GET exists', () => {
        service.checkExists().subscribe(exists => {
            expect(exists).toBe(true);
        });
        const req = httpMock.expectOne(`${apiUrl}/exists`);
        expect(req.request.method).toBe('GET');
        req.flush(true);
    });

    it('refresh should update members$ observable', () => {
        const mockMembers = [
            { id: '1', name: 'Alice', role: MemberRole.Lead, isActive: true, createdAt: '' }
        ];
        service.refresh();
        const req = httpMock.expectOne(apiUrl);
        req.flush(mockMembers);

        let result: any[] = [];
        service.members$.subscribe(m => result = m);
        expect(result.length).toBe(1);
    });
});
