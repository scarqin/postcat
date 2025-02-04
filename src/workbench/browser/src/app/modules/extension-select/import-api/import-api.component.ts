import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EoNgFeedbackMessageService } from 'eo-ng-feedback';
import { FeatureInfo } from 'eo/workbench/browser/src/app/shared/models/extension-manager';
import { ExtensionService } from 'eo/workbench/browser/src/app/shared/services/extensions/extension.service';
import { Message, MessageService } from 'eo/workbench/browser/src/app/shared/services/message';
import { ApiService } from 'eo/workbench/browser/src/app/shared/services/storage/api.service';
import { StoreService } from 'eo/workbench/browser/src/app/shared/store/state.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import StorageUtil from '../../../utils/storage/storage.utils';

// const optionList = [
//   {
//     value: 'import',
//     type: 'string',
//     default: '',
//     label: '直接导入',
//     description: '直接导入',
//   },
//   {
//     value: 'add',
//     type: 'string',
//     default: true,
//     label: '增量更新[推荐]',
//     description: '增量更新',
//   },
//   {
//     value: 'all',
//     type: 'string',
//     default: '',
//     label: '全量更新[慎用]',
//     description: '全量更新',
//   },
//   {
//     value: 'new',
//     type: 'string',
//     default: '',
//     label: '仅添加新 API',
//     description: '仅添加新 API',
//   },
// ];

@Component({
  selector: 'eo-import-api',
  template: `<extension-select
    [allowDrag]="true"
    tipsType="importAPI"
    [(extension)]="currentExtension"
    [extensionList]="supportList"
    (uploadChange)="uploadChange($event)"
  ></extension-select>`
})
export class ImportApiComponent implements OnInit {
  supportList: any[] = [];
  currentExtension = StorageUtil.get('import_api_modal');
  uploadData = null;
  featureMap: Map<string, FeatureInfo>;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private router: Router,
    private eoMessage: EoNgFeedbackMessageService,
    private extensionService: ExtensionService,
    private store: StoreService,
    private apiService: ApiService,
    private messageService: MessageService
  ) {}
  ngOnInit(): void {
    this.initData();
    this.messageService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe((inArg: Message) => {
        if (inArg.type === 'installedExtensionsChange') {
          this.initData();
        }
      });
  }
  initData = () => {
    this.featureMap = this.extensionService.getValidExtensionsByFature('importAPI');
    this.supportList = [];
    this.featureMap?.forEach((data: FeatureInfo, key: string) => {
      this.supportList.push({
        key,
        ...data
      });
    });
    if (!this.supportList.length) return;
    const { key } = this.supportList.at(0);
    if (!(this.currentExtension && this.supportList.find(val => val.key === this.currentExtension))) {
      this.currentExtension = key || '';
    }
  };
  uploadChange(data) {
    this.uploadData = data;
  }
  async submit(callback) {
    StorageUtil.set('import_api_modal', this.currentExtension);
    if (!this.uploadData) {
      this.eoMessage.error($localize`Please import the file first`);
      callback('stayModal');
      return;
    }
    // * this.currentExtension is extension's key, like 'postcat-import-openapi'
    const feature = this.featureMap.get(this.currentExtension);
    const action = feature.action || null;
    const module = await this.extensionService.getExtensionPackage(this.currentExtension);
    let { name, content } = this.uploadData;
    try {
      const [data, err] = module[action](content);
      console.log('import data', window.structuredClone?.(data));
      if (err) {
        console.error(err.msg);
        callback(false);
        return;
      }

      try {
        console.log('content', content);
        // TODO 兼容旧数据
        // if (Reflect.has(data, 'collections') && Reflect.has(data, 'environments')) {
        //   content = old2new(data, projectUuid, workSpaceUuid);
        //   console.log('new content', content);
        // }
        const [, err] = await this.apiService.api_projectImport({
          ...data,
          projectUuid: this.store.getCurrentProjectID,
          workSpaceUuid: this.store.getCurrentWorkspaceUuid
        });
        if (err) {
          callback(false);
          return;
        }
        callback(true);
        this.router.navigate(['home/workspace/project/api']);
      } catch (error) {
        callback(false);
        pcConsole.error('Import Error', error);
      }
    } catch (e) {
      console.error(e);
      callback(false);
    }
  }
}
