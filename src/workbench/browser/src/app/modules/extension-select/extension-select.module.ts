import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EoNgFeedbackTooltipModule } from 'eo-ng-feedback';
import { EoNgRadioModule } from 'eo-ng-radio';
import { SharedModule } from 'eo/workbench/browser/src/app/shared/shared.module';
import { NzUploadModule } from 'ng-zorro-antd/upload';

import { EoIconparkIconModule } from '../eo-ui/iconpark-icon/eo-iconpark-icon.module';
import { ExportApiComponent } from './export-api/export-api.component';
import { ImportApiComponent } from './import-api/import-api.component';
import { ExtensionSelectComponent } from './select/extension-select.component';
import { PushApiComponent } from './sync-api/sync-api.component';

const COMPONENTS = [ExtensionSelectComponent, ExportApiComponent, ImportApiComponent, PushApiComponent];
@NgModule({
  imports: [EoNgRadioModule, NzUploadModule, EoNgFeedbackTooltipModule, EoIconparkIconModule, CommonModule, FormsModule, SharedModule],
  declarations: [...COMPONENTS]
})
export class ExtensionSelectModule {}
