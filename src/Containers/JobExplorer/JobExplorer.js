/* eslint-disable camelcase */
import React, { useState, useEffect } from 'react';

import { useQueryParams } from '../../Utilities/useQueryParams';
import { formatQueryStrings } from '../../Utilities/formatQueryStrings';

import styled from 'styled-components';
import LoadingState from '../../Components/LoadingState';
import EmptyState from '../../Components/EmptyState';
import NoResults from '../../Components/NoResults';
import { preflightRequest, readJobExplorer, readJobExplorerOptions } from '../../Api';
import { jobExplorer } from '../../Utilities/constants';
import { Paths } from '../../paths';

import {
    Main,
    PageHeader,
    PageHeaderTitle
} from '@redhat-cloud-services/frontend-components';

import {
    DataToolbar,
    DataToolbarContent,
    DataToolbarFilter,
    DataToolbarToggleGroup,
    DataToolbarGroup,
    DataToolbarItem
} from '@patternfly/react-core/dist/esm/experimental';

import { FilterIcon } from '@patternfly/react-icons';

import {
    Badge,
    Card,
    CardBody,
    CardHeader as PFCardHeader,
    Pagination,
    PaginationVariant,
    Select,
    SelectOption,
    SelectVariant,
    DropdownPosition,
    Dropdown,
    DropdownToggle,
    DropdownItem
} from '@patternfly/react-core';

import JobExplorerList from '../../Components/JobExplorerList';

const CardHeader = styled(PFCardHeader)`
  display: flex;
  justify-content: space-between;

  @media screen and (max-width: 1035px) {
    display: block;
  }
`;

const TitleWithBadge = styled.div`
  display: flex;
  align-items: center;

  h2 {
    margin-right: 10px;
  }
`;

const perPageOptions = [
    { title: '5', value: 5 },
    { title: '10', value: 10 },
    { title: '20', value: 20 },
    { title: '50', value: 50 },
    { title: '100', value: 100 }
];

const initialQueryParams = {
    attributes: jobExplorer.attributes,
    limit: 5
};

const initialOptionsParams = {
    attributes: jobExplorer.attributes
};

const JobExplorer = (props) => {
    const [ preflightError, setPreFlightError ] = useState(null);
    const [ jobExplorerData, setJobExplorerData ] = useState([]);
    const [ firstRender, setFirstRender ] = useState(true);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ meta, setMeta ] = useState({});
    const [ currPage, setCurrPage ] = useState(1);
    const [ statusIsExpanded, setStatusIsExpanded ] = useState(false);
    const [ dateRangeIsExpanded, setDateRangeIsExpanded ] = useState(false);
    const [ jobTypeIsExpanded, setJobTypeIsExpanded ] = useState(false);
    const [ orgIsExpanded, setOrgIsExpanded ] = useState(false);
    const [ isCategoryExpanded, setIsCategoryExpanded ] = useState(false);
    const [ clusterIsExpanded, setClusterIsExpanded ] = useState(false);
    const [ templateIsExpanded, setTemplateIsExpanded ] = useState(false);
    const [ sortByIsExpanded, setSortByIsExpanded ] = useState(false);
    const [ currentCategory, setCurrentCategory ] = useState('Status');
    const [ filters, setFilters ] = useState({
        status: [ 'successful', 'failed' ],
        type: [ 'job', 'workflowjob' ],
        location: [],
        org: [],
        cluster: [],
        template: [],
        sortby: [],
        date: null
    });
    const [ orgIds, setOrgIds ] = useState([]);
    const [ clusterIds, setClusterIds ] = useState([]);
    const [ templateIds, setTemplateIds ] = useState([]);
    const [ sortBy, setSortBy ] = useState([]);
    const [ statuses, setStatuses ] = useState([]);
    const [ jobTypes, setJobTypes ] = useState([]);
    const [ quickDateRanges, setQuickDateRanges ] = useState([]);
    const {
        queryParams,
        setLimit,
        setOffset,
        setJobType,
        setOrg,
        setStatus,
        setCluster,
        setTemplate,
        setSortBy2
    } = useQueryParams(initialQueryParams);

    const {
        queryParams: optionsQueryParams
    } = useQueryParams(initialOptionsParams);

    const { parse } = formatQueryStrings(queryParams);
    const { location: { search }} = props;
    const initialSearchParams = parse(search);
    const combined = { ...queryParams, ...initialSearchParams };

    useEffect(() => {
        const updateURL = () => {
            const { jobExplorer } = Paths;
            const { strings, stringify } = formatQueryStrings(combined);
            const search = stringify(strings);
            props.history.push({
                pathname: jobExplorer,
                search
            });
        };

        insights.chrome.appNavClick({ id: 'job-explorer', secondaryNav: true });
        updateURL();
    }, []);

    useEffect(() => {
        if (firstRender) {
            return;
        }

        const getData = () => {
            return Promise.all(
                [ readJobExplorer({ params: combined }) ],
                [ readJobExplorerOptions({ params: optionsQueryParams }) ]
            );

        };

        const update = async () => {
            setIsLoading(true);
            await window.insights.chrome.auth.getUser();
            getData().then(
                ([
                    { items: jobExplorerData = [], meta }
                ]) => {
                    setJobExplorerData(jobExplorerData);
                    setMeta(meta);
                    setIsLoading(false);
                }
            );
        };

        update();
    }, [ queryParams ]);

    useEffect(() => {
        if (firstRender) {
            return;
        }

        if (filters.type) {
            setJobType(filters.type);
        }

        if (filters.status) {
            setStatus(filters.status);
        }

        if (filters.org) {
            setOrg(filters.org);
        }

        if (filters.cluster) {
            setCluster(filters.cluster);
        }

        if (filters.template) {
            setTemplate(filters.template);
        }

        if (filters.sortby) {
            setSortBy2(filters.sortby);
        }
    }, [ filters ]);

    useEffect(() => {
        let ignore = false;

        const fetchEndpoints = () => {
            return Promise.all([
                readJobExplorer({ params: combined }),
                readJobExplorerOptions({ params: optionsQueryParams })

            ].map(p => p.catch(() => [])));
        };

        async function initializeWithPreflight() {
            setIsLoading(true);
            await window.insights.chrome.auth.getUser();
            await preflightRequest().catch(error => {
                setPreFlightError({ preflightError: error });
            });
            fetchEndpoints().then(
                ([
                    { items: jobExplorerData = [], meta },
                    {
                        cluster_id,
                        org_id,
                        job_type,
                        status,
                        template_id,
                        quick_date_range,
                        sort_by }
                ]) => {
                    if (!ignore) {
                        setJobExplorerData(jobExplorerData);
                        setMeta(meta);
                        setClusterIds(cluster_id);
                        setOrgIds(org_id);
                        setTemplateIds(template_id);
                        setSortBy(sort_by);
                        setStatuses(status);
                        setJobTypes(job_type);
                        setQuickDateRanges(quick_date_range);
                        setFirstRender(false);
                        setIsLoading(false);
                    }
                }
            );
        }

        initializeWithPreflight();
        return () => (ignore = true);
    }, []);

    const handleChips = (item, comparator) => {
        return item.reduce((acc, i) => {
            Number.isInteger(parseInt(i)) ? i = parseInt(i) : i;
            comparator.forEach(org => {
                if (org.key === i) {
                    acc.push(org.value);
                }
            });
            return acc;
        }, []);
    };

    const handleDateChips = (date, comparator) => {
        if (date && typeof date === 'string') {
            let val;
            comparator.forEach(i => {
                if (i.key === date) {
                    val = i.value;
                }
            });
            return new Array(val);
        }

        return new Array();
    };

    const onDelete = (type, val) => {
        let filtered;
        Number.isInteger(val) ? val = parseInt(val) : val;

        if (type === 'Status') {
            filtered = statuses.filter(status => status.value === val);
        }

        if (type === 'Type') {
            filtered = jobTypes.filter(job => job.value === val);
        }

        if (type === 'Org') {
            filtered = orgIds.filter(org => org.value === val);
        }

        if (type === 'Cluster') {
            filtered = clusterIds.filter(cluster => cluster.value === val);
        }

        if (type === 'Template') {
            filtered = templateIds.filter(template => template.value === val);
        }

        if (type === 'SortBy') {
            filtered = sortBy.filter(attr => attr.value === val);
        }

        if (type) {
            if (type === 'Date') {
                setFilters({
                    ...filters,
                    date: null
                });
            } else {
                setFilters({
                    ...filters,
                    [type.toLowerCase()]: filters[type.toLowerCase()].filter(value => value !== filtered[0].key)
                });
            }
        } else {
            setFilters(
                {
                    status: [],
                    type: [],
                    org: [],
                    cluster: [],
                    template: [],
                    sortby: [],
                    date: null
                }
            );
        }
    };

    const buildCategoryDropdown = () => {
        return (
            <DataToolbarItem>
                <Dropdown
                    onSelect={ (e) => {
                        setCurrentCategory(e.target.innerText);
                        setIsCategoryExpanded(!isCategoryExpanded);
                    } }
                    position={ DropdownPosition.left }
                    toggle={
                        <DropdownToggle onToggle={ () => { setIsCategoryExpanded(!isCategoryExpanded); } } style={ { width: '100%' } }>
                            <FilterIcon />&nbsp;{ currentCategory }
                        </DropdownToggle>
                    }
                    isOpen={ isCategoryExpanded }
                    dropdownItems={ [
                        <DropdownItem key="cat0">Status</DropdownItem>,
                        <DropdownItem key="cat6">Date</DropdownItem>,
                        <DropdownItem key="cat1">Job type</DropdownItem>,
                        <DropdownItem key="cat2">Organization</DropdownItem>,
                        <DropdownItem key="cat3">Cluster</DropdownItem>,
                        <DropdownItem key="cat4">Template</DropdownItem>,
                        <DropdownItem key="cat5">Sort by</DropdownItem>
                    ] }
                    style={ { width: '100%' } }
                ></Dropdown>
            </DataToolbarItem>
        );
    };

    const buildFilterDropdown = () => {
        const organizationIdMenuItems = orgIds.map(({ key, value }) => (
            <SelectOption key={ key } value={ `${key}` }>{ value }</SelectOption>
        ));

        const statusMenuItems = statuses.map(({ key, value }) => (
            <SelectOption key={ key } value={ key }>{ value }</SelectOption>
        ));

        const jobTypeMenuItems = jobTypes.map(({ key, value }) => (
            <SelectOption key={ key } value={ key }>{ value }</SelectOption>
        ));

        const clusterIdMenuItems = clusterIds.map(({ key, value }) => (
            <SelectOption key={ key } value={ `${key}` }>{ value }</SelectOption>
        ));

        const templateIdMenuItems = templateIds.map(({ key, value }) => (
            <SelectOption key={ key } value={ `${key}` }>{ value }</SelectOption>
        ));

        const sortByMenuItems = sortBy.map(({ key, value }) => (
            <SelectOption key={ key } value={ key }>{ value }</SelectOption>
        ));

        const dateRangeMenuItems = quickDateRanges.map(({ key, value }) => (
            <SelectOption key={ key } value={ key }>{ value }</SelectOption>
        ));

        const onSelect = (type, event, selection) => {
            const checked = event.target.checked;

            setFilters({
                ...filters,
                [type]: checked
                    ? [ ...filters[type], selection ]
                    : filters[type].filter((value) => value !== selection)
            });
        };

        const onDateSelect = (_event, selection) => {
            setFilters({
                ...filters,
                date: selection
            });
            setDateRangeIsExpanded(!dateRangeIsExpanded);
        };

        return (
            <React.Fragment>
                <DataToolbarFilter
                    showToolbarItem={ currentCategory === 'Status' }
                    chips={ handleChips(filters.status, statuses) }
                    categoryName="Status"
                    deleteChip={ onDelete }
                >
                    <Select
                        variant={ SelectVariant.checkbox }
                        aria-label="Status"
                        onToggle={ () => { setStatusIsExpanded(!statusIsExpanded); } }
                        onSelect={ (event, selection) => {
                            onSelect('status', event, selection);
                        } }
                        selections={ filters.status }
                        isExpanded={ statusIsExpanded }
                        placeholderText="Filter by job status"
                    >
                        { statusMenuItems }
                    </Select>
                </DataToolbarFilter>
                <DataToolbarFilter
                    showToolbarItem={ currentCategory === 'Date' }
                    categoryName="Date"
                    chips={ handleDateChips(filters.date, quickDateRanges) }
                    deleteChip={ onDelete }
                >
                    <Select
                        variant={ SelectVariant.single }
                        aria-label="Date"
                        onToggle={ () => { setDateRangeIsExpanded(!dateRangeIsExpanded); } }
                        onSelect={ (event, selection) => {
                            onDateSelect(event, selection);
                        } }
                        selections={ filters.date }
                        isExpanded={ dateRangeIsExpanded }
                        placeholderText="Filter by date range"
                    >
                        { dateRangeMenuItems }
                    </Select>
                </DataToolbarFilter>
                <DataToolbarFilter
                    showToolbarItem={ currentCategory === 'Job type' }
                    categoryName="Type"
                    chips={ handleChips(filters.type, jobTypes) }
                    deleteChip={ onDelete }
                >
                    <Select
                        aria-label="Type"
                        variant={ SelectVariant.checkbox }
                        onToggle={ () => { setJobTypeIsExpanded(!jobTypeIsExpanded);} }
                        onSelect={ (event, selection) => {
                            onSelect('type', event, selection);
                        } }
                        selections={ filters.type }
                        isExpanded={ jobTypeIsExpanded }
                        placeholderText="Filter by job type"
                    >
                        { jobTypeMenuItems }
                    </Select>
                </DataToolbarFilter>
                <DataToolbarFilter
                    showToolbarItem={ currentCategory === 'Organization' }
                    categoryName="Org"
                    chips={ handleChips(filters.org, orgIds) }
                    deleteChip={ onDelete }
                >
                    <Select
                        aria-label="Filter by Org"
                        variant={ SelectVariant.checkbox }
                        onToggle={ () => { setOrgIsExpanded(!orgIsExpanded); } }
                        onSelect={ (event, selection) => {
                            onSelect('org', event, selection);
                        } }
                        selections={ filters.org }
                        isExpanded={ orgIsExpanded }
                        placeholderText="Filter by organization"
                    >
                        { organizationIdMenuItems }
                    </Select>
                </DataToolbarFilter>
                <DataToolbarFilter
                    showToolbarItem={ currentCategory === 'Cluster' }
                    categoryName="Cluster"
                    chips={ handleChips(filters.cluster, clusterIds) }
                    deleteChip={ onDelete }
                >
                    <Select
                        aria-label="Filter by Cluster"
                        variant={ SelectVariant.checkbox }
                        onToggle={ () => { setClusterIsExpanded(!clusterIsExpanded); } }
                        onSelect={ (event, selection) => {
                            onSelect('cluster', event, selection);
                        } }
                        selections={ filters.cluster }
                        isExpanded={ clusterIsExpanded }
                        placeholderText="Filter by cluster"
                    >
                        { clusterIdMenuItems }
                    </Select>
                </DataToolbarFilter>
                <DataToolbarFilter
                    showToolbarItem={ currentCategory === 'Template' }
                    categoryName="Template"
                    chips={ handleChips(filters.template, templateIds) }
                    deleteChip={ onDelete }
                >
                    <Select
                        aria-label="Filter by template"
                        variant={ SelectVariant.checkbox }
                        onToggle={ () => setTemplateIsExpanded(!templateIsExpanded) }
                        onSelect={ (event, selection) => {
                            onSelect('template', event, selection);
                        } }
                        selections={ filters.template }
                        isExpanded={ templateIsExpanded }
                        placeholderText="Filter by template"
                    >
                        { templateIdMenuItems }
                    </Select>
                </DataToolbarFilter>
                <DataToolbarFilter
                    showToolbarItem={ currentCategory === 'Sort by' }
                    categoryName="SortBy"
                    chips={ handleChips(filters.sortby, sortBy) }
                    deleteChip={ onDelete }
                >
                    <Select
                        aria-label="Sort by"
                        variant={ SelectVariant.checkbox }
                        onToggle={ () => { setSortByIsExpanded(!sortByIsExpanded); } }
                        onSelect={ (event, selection) => {
                            onSelect('sortby', event, selection);
                        } }
                        selections={ filters.sortby }
                        isExpanded={ sortByIsExpanded }
                        placeholderText="Sort by attribute"
                    >
                        { sortByMenuItems }
                    </Select>
                </DataToolbarFilter>
            </React.Fragment>
        );
    };

    const returnOffsetVal = (page) => {
        let offsetVal = (page - 1) * queryParams.limit;
        return offsetVal;
    };

    const title = (
        <span>
      Automation Analytics
            <span style={ { fontSize: '16px' } }>
                { ' ' }
                <span style={ { margin: '0 10px' } }>|</span> All Jobs
            </span>
        </span>
    );

    const handleSetPage = (page) => {
        const nextOffset = returnOffsetVal(page);
        setOffset(nextOffset);
        setCurrPage(page);
    };

    const handlePerPageSelect = (perPage, page) => {
        setLimit(perPage);
        const nextOffset = returnOffsetVal(page);
        setOffset(nextOffset);
        setCurrPage(page);
    };

    return (
        <React.Fragment>
            <PageHeader>
                <PageHeaderTitle title={ title } />
            </PageHeader>

            { preflightError && (
                <Main>
                    <EmptyState { ...preflightError } />
                </Main>
            ) }

            { !preflightError && (
        <>
          <Main>
              <Card>
                  <CardHeader>
                      <TitleWithBadge>
                          <h2>
                              <strong>Total Jobs</strong>
                          </h2>
                          <Badge isRead>{ meta.count ? meta.count : 0 }</Badge>
                      </TitleWithBadge>
                  </CardHeader>
                  <CardBody>
                      <DataToolbar
                          id="data-toolbar-with-chip-groups"
                          clearAllFilters={ onDelete }
                          collapseListedFiltersBreakpoint="xl"
                      >
                          <DataToolbarContent>
                              <DataToolbarToggleGroup toggleIcon={ <FilterIcon /> } breakpoint="xl">
                                  <DataToolbarGroup variant="filter-group">
                                      { buildCategoryDropdown() }
                                      { buildFilterDropdown() }
                                  </DataToolbarGroup>
                              </DataToolbarToggleGroup>
                          </DataToolbarContent>
                      </DataToolbar>
                      { isLoading && <LoadingState /> }
                      { !isLoading && jobExplorerData.length <= 0 && <NoResults /> }
                      { !isLoading && jobExplorerData.length > 0 && (
                                    <>
                                        <JobExplorerList
                                            jobs={ jobExplorerData }
                                        />
                                        <Pagination
                                            itemCount={ meta.count ? meta.count : 0 }
                                            widgetId="pagination-options-menu-bottom"
                                            perPageOptions={ perPageOptions }
                                            perPage={ queryParams.limit }
                                            page={ currPage }
                                            variant={ PaginationVariant.bottom }
                                            dropDirection={ 'up' }
                                            onPerPageSelect={ (_event, perPage, page) => {
                                                handlePerPageSelect(perPage, page);
                                            } }
                                            onSetPage={ (_event, pageNumber) => {
                                                handleSetPage(pageNumber);
                                            } }
                                            style={ { marginTop: '20px' } }
                                        />
                                    </>
                      ) }
                  </CardBody>
              </Card>
          </Main>
                </>

            ) }
        </React.Fragment>
    );
};

export default JobExplorer;
